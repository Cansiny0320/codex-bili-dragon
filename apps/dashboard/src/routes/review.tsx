import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Clock, AlertCircle, HelpCircle } from 'lucide-react';
import type { Channel } from '@bili-dragon/runtime/types';
import { useDashboard, formatTime } from '../lib/state';
import { Panel, Empty, Loading } from '../components/common';
import { Button } from '../components/ui/button';
export const Route = createFileRoute('/review')({ component: Review });
function Review() {
  const { state, loading, busy, perform } = useDashboard();
  const [channel, setChannel] = useState<Channel>('comments'),
    [selected, setSelected] = useState(''),
    [showAll, setAll] = useState(false);
  if (!state) return loading ? <Loading /> : null;
  const drafts = state.drafts.filter(
    (d) =>
      state.inbox.find((e) => e.id === d.eventId)?.channel === channel &&
      (showAll || d.state === 'draft'),
  );
  const draft = drafts.find((d) => d.id === selected) ?? drafts[0];
  const event = state.inbox.find((e) => e.id === draft?.eventId);
  const issues = state.jobs.filter((j) => j.state === 'needs-review' || j.state === 'pending');
  const ops = state.operations.filter((o) => o.state === 'needs-review' || o.state === 'sending');
  const labels = {
    draft: '待审核',
    sending: '发送中',
    sent: '已发送',
    rejected: '已拒绝',
    'needs-review': '待核查',
  };
  return (
    <div
      className={
        (draft || ops.length || issues.length ? 'split-page' : 'page-stack') + ' review-page'
      }
    >
      <Panel className="list-panel">
        <h1>待我审核</h1>
        <div className="review-filters">
          <div className="tabs">
            {(['comments', 'dm', 'live'] as const).map((c, i) => (
              <button
                key={c}
                className={channel === c ? 'selected' : ''}
                onClick={() => setChannel(c)}
              >
                {['评论', '私信', '直播弹幕'][i]}
                <span>
                  {
                    state.drafts.filter(
                      (d) =>
                        d.state === 'draft' &&
                        state.inbox.find((e) => e.id === d.eventId)?.channel === c,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
          <select
            aria-label="审核筛选"
            value={String(showAll)}
            onChange={(e) => setAll(e.target.value === 'true')}
          >
            <option value="false">待处理</option>
            <option value="true">全部记录</option>
          </select>
        </div>
        {drafts.length ? (
          drafts.map((d) => {
            const e = state.inbox.find((x) => x.id === d.eventId);
            return (
              <button
                key={d.id}
                className={'review-list-item ' + (draft?.id === d.id ? 'selected' : '')}
                onClick={() => setSelected(d.id)}
              >
                <div className="review-row-heading">
                  <strong>{e?.title || e?.name || e?.uname || `UID ${e?.mid ?? '—'}`}</strong>
                  <small>{labels[d.state]}</small>
                </div>
                <span className="muted">{formatTime(d.createdAt)}</span>
                <p>{e?.text}</p>
              </button>
            );
          })
        ) : (
          <Empty>暂无待审核的消息。</Empty>
        )}
      </Panel>
      {(draft || ops.length > 0 || issues.length > 0) && (
        <Panel className="review-detail">
          {draft && event ? (
            <>
              <h2>{event.title || `UID ${event.mid}`}</h2>
              <p className="muted">{formatTime(draft.createdAt)}</p>
              <section className="content-divider">
                <h2>原消息</h2>
                <strong>{event.name || event.uname || `UID ${event.mid}`}</strong>
                <p className="message-text">{event.text}</p>
              </section>
              <section className="content-divider">
                <h2>小白龙想这样回</h2>
                <blockquote className="reply-text">{draft.text}</blockquote>
                {draft.state === 'draft' ? (
                  <>
                    <div className="approval-actions">
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void perform((c) => c.reject({ id: draft.id }))}
                      >
                        拒绝
                      </Button>
                      <Button
                        disabled={busy || !state.config.permissions[event.channel]}
                        onClick={() => void perform((c) => c.approve({ id: draft.id }))}
                      >
                        批准发送
                      </Button>
                    </div>
                    {!state.config.permissions[event.channel] && (
                      <p className="muted">请先在操作权限中开启此发送通道。</p>
                    )}
                  </>
                ) : (
                  <p className="muted">{labels[draft.state]}</p>
                )}
              </section>
            </>
          ) : (
            <Empty>选一条消息，看看小白龙想怎么回。</Empty>
          )}
          {ops.length > 0 && (
            <section className="content-divider">
              <h2>发送结果</h2>
              {ops.map((o) => (
                <div className="issue-row" key={o.key}>
                  {o.state === 'sending' ? <Clock /> : <HelpCircle />}
                  <div>
                    <strong>
                      {o.state === 'sending' ? '发送中，等待结果' : '结果不明，需要核查'}
                    </strong>
                    <p>{o.error || o.key}</p>
                  </div>
                </div>
              ))}
            </section>
          )}
          {issues.length > 0 && (
            <section className="content-divider">
              <h2>待核查任务</h2>
              {issues.map((j) => (
                <div className="issue-row" key={j.id}>
                  <AlertCircle />
                  <div>
                    <strong>{j.state === 'pending' ? '等待处理' : '任务中断'}</strong>
                    <p>{typeof j.result === 'string' ? j.result : formatTime(j.createdAt)}</p>
                  </div>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void perform((c) => c.dismiss({ id: j.id }))}
                  >
                    关闭待办
                  </Button>
                </div>
              ))}
            </section>
          )}
        </Panel>
      )}
    </div>
  );
}
