import { Button } from './ui/button';
import type { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  House,
  PlayCircle,
  NotebookText,
  History,
  SquareCheck,
  Heart,
  Clock,
  ShieldCheck,
  Link2,
  Menu,
  X,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useDashboard } from '../lib/state';
const items = [
  ['/', '首页', House],
  ['/videos', '观看记录', PlayCircle],
  ['/activity', '行动记录', History],
  ['/diary', '日记', NotebookText],
  ['/review', '待我审核', SquareCheck],
  ['/personality', '个性与兴趣', Heart],
  ['/schedule', '活动时间', Clock],
  ['/permissions', '操作权限', ShieldCheck],
  ['/account', '账号连接', Link2],
] as const;
export function Shell({ children }: { children: ReactNode }) {
  const { state, error, notice, clearError } = useDashboard((s) => ({
    state: s.state,
    error: s.error,
    notice: s.notice,
    clearError: s.clearError,
  }));
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const count = state?.drafts.filter((d) => d.state === 'draft').length ?? 0;
  return (
    <div className="app-shell">
      <header className="mobile-header">
        <Button variant="ghost" aria-label="打开导航" onClick={() => setOpen(!open)}>
          <Menu />
        </Button>
        <span className="mobile-brand">
          <img src={dragonIcon} alt="" />
          <strong>B 站小白龙</strong>
        </span>
      </header>
      <aside className={'sidebar ' + (open ? 'is-open' : '')}>
        <div className="brand">
          <img src={dragonIcon} alt="" />
          <strong>B 站小白龙</strong>
        </div>
        <nav aria-label="主导航">
          {items.map(([to, label, Icon]) => (
            <Link
              key={to}
              to={to}
              className={'nav-item ' + (pathname === to ? 'active' : '')}
              onClick={() => setOpen(false)}
            >
              <Icon strokeWidth={1.7} />
              <span>{label}</span>
              {to === '/review' && count > 0 && <b className="count-badge">{count}</b>}
            </Link>
          ))}
        </nav>
      </aside>
      {open && (
        <Button
          variant="ghost"
          className="nav-backdrop"
          aria-label="关闭导航"
          onClick={() => setOpen(false)}
        />
      )}
      <main className="main-content">
        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={20} />
            <span>{error}</span>
            <Button variant="ghost" aria-label="关闭提示" onClick={clearError}>
              <X size={18} />
            </Button>
          </div>
        )}
        {notice && (
          <div className="save-notice" role="status">
            {notice}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
import dragonIcon from '../../../../assets/avatar.png?inline';
