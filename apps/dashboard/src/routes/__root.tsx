import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { DashboardProvider } from '../lib/state';
import { Shell } from '../components/shell';
import styles from '../styles.css?url';
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Codex Bili Dragon · B 站小白龙' },
    ],
    links: [{ rel: 'stylesheet', href: styles }],
  }),
  component: () =>
    typeof window !== 'undefined' && window.dragonApp ? (
      <DashboardProvider>
        <Shell>
          <Outlet />
        </Shell>
      </DashboardProvider>
    ) : (
      <html lang="zh-CN">
        <head>
          <HeadContent />
        </head>
        <body>
          <DashboardProvider>
            <Shell>
              <Outlet />
            </Shell>
          </DashboardProvider>
          <Scripts />
        </body>
      </html>
    ),
});
