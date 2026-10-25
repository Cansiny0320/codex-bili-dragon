import { App, applyHostStyleVariables } from '@modelcontextprotocol/ext-apps';
import { createRoot } from 'react-dom/client';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { createAppClient } from './lib/app-client';
import type { AdminState } from '@bili-dragon/runtime/api';
import './styles.css';

const app = new App(
  { name: 'B 站小白龙', version: '0.3.1' },
  {},
  { autoResize: false, strict: true },
);
let initialState: AdminState | undefined;
app.ontoolresult = (result) => {
  if (
    typeof result.structuredContent === 'object' &&
    result.structuredContent !== null &&
    'state' in result.structuredContent
  ) {
    initialState = result.structuredContent.state as AdminState;
    window.dispatchEvent(new CustomEvent('dragon-state', { detail: initialState }));
  }
};
function applyContext() {
  const context = app.getHostContext();
  if (context?.styles?.variables) applyHostStyleVariables(context.styles.variables);
  if (context?.safeAreaInsets) {
    const { top, right, bottom, left } = context.safeAreaInsets;
    document.body.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
  }
}
app.addEventListener('hostcontextchanged', applyContext);
app.onteardown = () => {
  void app.close();
  return {};
};
async function start() {
  // The SDK's default transport logs raw messages. Keep account input out of console logs.
  const transport: NonNullable<Parameters<App['connect']>[0]> = {
    start: async () => {
      window.addEventListener('message', receive);
    },
    send: async (message) => {
      window.parent.postMessage(message, '*');
    },
    close: async () => {
      window.removeEventListener('message', receive);
      transport.onclose?.();
    },
  };
  function receive(event: MessageEvent) {
    if (event.source === window.parent && event.data?.jsonrpc === '2.0')
      transport.onmessage?.(event.data);
  }
  await app.connect(transport);
  applyContext();
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest('a[href]');
    if (link instanceof HTMLAnchorElement && link.href.startsWith('https://')) {
      event.preventDefault();
      void app.openLink({ url: link.href });
    }
  });
  window.dragonApp = { client: createAppClient(app), initialState };
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    scrollRestoration: true,
  });
  createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
}
void start().catch((error: unknown) => {
  const container = document.getElementById('root')!;
  container.textContent =
    error instanceof Error ? error.message : '无法连接 Codex，请更新桌面应用后重新打开管理页。';
  container.setAttribute('role', 'alert');
});
