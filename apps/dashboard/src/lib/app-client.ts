import type { App } from '@modelcontextprotocol/ext-apps';
import type { RouterClient } from '@orpc/server';
import type { ApiRouter, AdminState } from '@bili-dragon/runtime/api';

export type AdminClient = RouterClient<ApiRouter>;
declare global {
  interface Window {
    dragonApp?: { client: AdminClient; initialState?: AdminState };
  }
}
export function createAppClient(app: Pick<App, 'callServerTool'>): AdminClient {
  async function call<T>(action: string, input: Record<string, unknown> = {}): Promise<T> {
    const result = await app.callServerTool({ name: 'dragon_admin_' + action, arguments: input });
    if (result.isError) {
      const text = result.content.find((item) => item.type === 'text');
      throw Error(text?.type === 'text' ? text.text : '后台操作失败');
    }
    if (
      typeof result.structuredContent !== 'object' ||
      result.structuredContent === null ||
      !('result' in result.structuredContent)
    )
      throw Error('后台返回格式不正确，请更新插件');
    return result.structuredContent.result as T;
  }
  return {
    activity: (input) => call('activity', input),
    material: (input) => call('material', input),
    state: () => call<AdminState>('state'),
    config: (input) => call('config', input),
    credentials: (input) => call('credentials', input),
    checkLogin: () => call('checkLogin'),
    loginStart: () => call('loginStart'),
    loginPoll: (input) => call('loginPoll', input),
    loginCancel: (input) => call('loginCancel', input),
    run: () => call('run'),
    pause: () => call('pause'),
    approve: (input) => call('approve', input),
    reject: (input) => call('reject', input),
    dismiss: (input) => call('dismiss', input),
  };
}
