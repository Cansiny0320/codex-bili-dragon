import { useId, type ReactNode, type InputHTMLAttributes } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ChevronRight,
  Play,
  Pause,
  Square,
  Video as VideoIcon,
  ExternalLink,
  LoaderCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useDashboard, type Video } from '../lib/state';

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={'panel ' + className}>{children}</section>;
}
export function SectionTitle({
  children,
  to,
}: {
  children: ReactNode;
  to?:
    | '/'
    | '/videos'
    | '/diary'
    | '/review'
    | '/personality'
    | '/schedule'
    | '/permissions'
    | '/account';
}) {
  return (
    <div className="section-heading">
      <h2>{children}</h2>
      {to && (
        <Link to={to} className="more-link">
          查看全部
          <ChevronRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
export function Loading() {
  return (
    <div className="empty-state" aria-live="polite">
      <LoaderCircle className="spin" />
      正在加载
    </div>
  );
}
export function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={'field ' + className}>
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={'input ' + (props.className ?? '')} />;
}
export function Toggle({
  label,
  checked,
  onChange,
  description,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="toggle-row">
      <label htmlFor={id}>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
export function SaveBar({
  save,
  reset,
  dirty,
  busy,
}: {
  save: () => Promise<void>;
  reset: () => void;
  dirty: boolean;
  busy: boolean;
}) {
  return (
    <div className="save-bar">
      <Button variant="secondary" onClick={reset} disabled={!dirty || busy}>
        取消
      </Button>
      <Button onClick={() => void save()} disabled={!dirty || busy}>
        {busy ? '保存中…' : '保存更改'}
      </Button>
    </div>
  );
}
export function StatusBar() {
  const { state, busy, perform } = useDashboard();
  if (!state) return null;
  const running = state.runtime.state === 'running',
    enabled = state.config.enabled;
  return (
    <Panel className="status-bar">
      <span className={'status-light ' + (running || enabled ? 'online' : 'paused')} />
      <div className="status-copy">
        <h1>{running ? '助手正在探索' : enabled ? '助手已开启' : '助手已暂停'}</h1>
        <p>
          {running
            ? '当前任务完成后会更新记录'
            : enabled
              ? '等待下一次活动机会'
              : '可以手动开始一次探索'}
        </p>
      </div>
      <div className="status-actions">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() =>
            void perform((c) =>
              enabled || running ? c.pause() : c.config({ ...state.config, enabled: true }),
            )
          }
        >
          {enabled || running ? <Pause /> : <Play />}
          {enabled || running ? '暂停运行' : '开启运行'}
        </Button>
        <Button
          variant={running ? 'destructive' : 'default'}
          disabled={busy}
          onClick={() => void perform((c) => (running ? c.pause() : c.run()))}
        >
          {running ? <Square /> : <Play />}
          {running ? '停止探索' : '探索一次'}
        </Button>
      </div>
    </Panel>
  );
}
export function Cover({ video, className = '' }: { video: Partial<Video>; className?: string }) {
  return (
    <div className={'video-cover ' + className}>
      {video.cover ? (
        <img src={video.cover} referrerPolicy="no-referrer" alt="" loading="lazy" />
      ) : (
        <VideoIcon strokeWidth={1.2} />
      )}{' '}
      {!!video.duration && (
        <span className="duration">
          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
        </span>
      )}
    </div>
  );
}
export function VideoCard({ video }: { video: Video }) {
  return (
    <Link to="/videos" search={{ bv: video.bvid }} className="video-card">
      <Cover video={video} />
      <strong>{video.title}</strong>
      {video.author && <span>{video.author}</span>}
      <small>{new Date(video.at).toLocaleDateString('zh-CN')}</small>
    </Link>
  );
}
export function BiliLink({
  bvid,
  children = '在 B 站打开原视频',
}: {
  bvid: string;
  children?: ReactNode;
}) {
  return (
    <a
      className="external-link"
      href={'https://www.bilibili.com/video/' + bvid}
      target="_blank"
      rel="noreferrer"
    >
      <ExternalLink size={17} />
      {children}
    </a>
  );
}
