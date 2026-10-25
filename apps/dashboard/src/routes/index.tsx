import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight, NotebookText, MessageSquare, Mail, PlayCircle, Link2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AdminState } from '@bili-dragon/runtime/api';
import { useDashboard, videosFrom, formatTime } from '../lib/state';
import { Panel, SectionTitle, Empty, Loading, StatusBar, VideoCard } from '../components/common';
import { Button } from '../components/ui/button';
import type { Channel } from '@bili-dragon/runtime/types';
export const Route = createFileRoute('/')({ component: Home });
function Home() {
  const { state, client, loading, busy, perform, refresh } = useDashboard((s) => ({
    state: s.state,
    client: s.client,
    loading: s.loading,
    busy: s.busy,
    perform: s.perform,
    refresh: s.refresh,
  }));
  const [channel, setChannel] = useState<Channel>('comments');
  const [account, setAccount] = useState<AdminState['account']>(null);
  const [connection, setConnection] = useState('检查中…');
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const hasCredentials = state?.hasCredentials;
  useEffect(() => {
    if (!client || !hasCredentials) {
      setAccount(null);
      setConnection('未连接');
      return;
    }
    let active = true;
    setConnection('检查中…');
    void client
      .checkLogin()
      .then((result) => {
        if (!active) return;
        setAccount(result.account ?? null);
        setConnection(
          result.status === 'connected'
            ? '已连接'
            : result.status === 'expired'
              ? '登录已失效'
              : '未连接',
        );
        void refreshRef.current();
      })
      .catch(() => {
        if (active) setConnection('连接检查失败');
      });
    return () => {
      active = false;
    };
  }, [client, hasCredentials]);
  if (!state) return loading ? <Loading /> : null;
  const videos = videosFrom(state).slice(0, 5),
    last = state.diaries.at(-1);
  const drafts = state.drafts.filter((d) => d.state === 'draft');
  const visible = drafts
    .filter((d) => state.inbox.find((e) => e.id === d.eventId)?.channel === channel)
    .slice(0, 3);
  return (
    <div className="home-grid">
      <div className="page-stack">
        <StatusBar />
        <Panel>
          <SectionTitle to="/videos">最近逛到的视频</SectionTitle>
          {videos.length ? (
            <div className="video-grid">
              {videos.map((v) => (
                <VideoCard key={v.bvid} video={v} />
              ))}
            </div>
          ) : (
            <Empty>小白龙还没出门逛过。</Empty>
          )}
        </Panel>
        <Panel>
          <SectionTitle to="/review">
            消息 {drafts.length > 0 && <b className="count-badge">{drafts.length}</b>}
          </SectionTitle>
          <Tabs value={channel} onValueChange={(value) => setChannel(value as Channel)}>
            <TabsList variant="line" className="mb-3">
              {(['comments', 'dm', 'live'] as const).map((c, i) => (
                <TabsTrigger key={c} value={c}>
                  {['评论', '私信', '直播弹幕'][i]}
                  <span>
                    {
                      drafts.filter(
                        (d) => state.inbox.find((e) => e.id === d.eventId)?.channel === c,
                      ).length
                    }
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={channel}>
              {visible.length ? (
                visible.map((d) => {
                  const e = state.inbox.find((x) => x.id === d.eventId);
                  return (
                    <article className="review-preview" key={d.id}>
                      <div>
                        <strong>{e?.title || e?.name || e?.uname || `UID ${e?.mid ?? '—'}`}</strong>
                        <small>{formatTime(d.createdAt)}</small>
                        <p>{d.text}</p>
                      </div>
                      <div className="row-actions">
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void perform((c) => c.reject({ id: d.id }))}
                        >
                          拒绝
                        </Button>
                        <Button
                          disabled={busy || !e || !state.config.permissions[e.channel]}
                          onClick={() => void perform((c) => c.approve({ id: d.id }))}
                        >
                          批准发送
                        </Button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <Empty>
                  暂无待审核的
                  {channel === 'comments' ? '评论' : channel === 'dm' ? '私信' : '直播弹幕'}。
                </Empty>
              )}
            </TabsContent>
          </Tabs>
        </Panel>
        <Panel>
          <SectionTitle to="/diary">最近的日记</SectionTitle>
          {last ? (
            <div className="diary-preview">
              {[false, true].map((privateDiary) => (
                <Link to="/diary" key={String(privateDiary)} className="diary-preview-item">
                  <NotebookText />
                  <div>
                    <strong>{privateDiary ? '内心日记' : state.config.persona.diaryTitle}</strong>
                    <small>{formatTime(last.at)}</small>
                    <p>{privateDiary ? last.privateText : last.publicText}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty>小白龙还没写过日记。</Empty>
          )}
        </Panel>
      </div>
      <aside className="page-stack home-aside">
        <Panel>
          <Link to="/schedule" className="section-heading">
            <h2>活动时间</h2>
            <ChevronRight />
          </Link>
          <div className="schedule-summary">
            {state.config.night.windows.map((w, i) => (
              <p key={i}>
                {w.start} – {w.end}
                <span>{w.wakes} 次机会</span>
              </p>
            ))}
          </div>
          <div className="timeline">
            {Array.from({ length: 24 }, (_, i) => (
              <i
                key={i}
                className={
                  state.config.night.windows.some((w) => {
                    const a = Number(w.start.slice(0, 2)),
                      b = Number(w.end.slice(0, 2));
                    return w.wakes > 0 && (a < b ? i >= a && i < b : i >= a || i < b);
                  })
                    ? 'on'
                    : ''
                }
              />
            ))}
          </div>
          <div className="timeline-labels">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </Panel>
        <Panel>
          <Link to="/personality" className="section-heading">
            <h2>个性与兴趣</h2>
            <ChevronRight />
          </Link>
          <div className="tags">
            {state.config.preferences.like.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </Panel>
        <Panel>
          <Link to="/permissions" className="section-heading">
            <h2>操作权限</h2>
            <ChevronRight />
          </Link>
          {(
            [
              [MessageSquare, '发布评论', 'comments'],
              [Mail, '发送私信', 'dm'],
              [PlayCircle, '发送直播弹幕', 'live'],
            ] as const
          ).map(([Icon, label, key]) => (
            <div key={key} className="summary-row">
              <Icon size={23} />
              <span>{label}</span>
              <span>
                {key === 'dm' && state.config.accountMode === 'single'
                  ? '单号不可用'
                  : state.config.permissions[key]
                    ? '允许'
                    : '关闭'}
              </span>
            </div>
          ))}
        </Panel>
        <Panel>
          <Link to="/account" className="section-heading">
            <h2>账号连接</h2>
            <ChevronRight />
          </Link>
          <Link to="/account" className="account-summary">
            {account?.avatar ? (
              <img src={account.avatar} alt="" referrerPolicy="no-referrer" />
            ) : (
              <Link2 />
            )}
            <div>
              <strong>{account?.name || 'B 站账号'}</strong>
              <p>
                <i className={'dot ' + (connection === '已连接' ? 'green' : '')} />
                {connection}
              </p>
              {account && <small>UID {account.uid}</small>}
            </div>
          </Link>
        </Panel>
        {!!state.runtime.error && (
          <Panel>
            <h2>任务异常</h2>
            <p className="error-text">{state.runtime.error}</p>
            <Link to="/review" className="more-link">
              查看待核查任务
              <ChevronRight size={17} />
            </Link>
          </Panel>
        )}
      </aside>
    </div>
  );
}
