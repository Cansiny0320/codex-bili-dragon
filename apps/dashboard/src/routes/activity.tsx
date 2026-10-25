import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { Activity } from '@bili-dragon/runtime/types';
import type { DashboardClient } from '../lib/dashboard-store';
import { useDashboard, formatTime } from '../lib/state';
import { Panel, Empty, Loading } from '../components/common';
import { Button } from '../components/ui/button';
import { NativeSelect, NativeSelectOption } from '../components/ui/native-select';

export const Route = createFileRoute('/activity')({ component: ActivityPage });
const sources = {
  autonomous: '自主运行',
  manual: '管理页操作',
  chat: '聊天工具',
  unknown: '来源未记录',
};
const states = {
  running: '进行中',
  success: '已完成',
  failed: '未完成',
  unknown: '待核查',
  draft: '待审核',
};
const pageSize = 30;
function ActivityPage() {
  const client = useDashboard((state) => state.client);
  const [type, setType] = useState('');
  const [status, setStatus] = useState<Activity['state'] | ''>('');
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<DashboardClient['activity']>> | null>(
    null,
  );
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true,
      sequence = 0;
    setResult(null);
    setError('');
    const load = async () => {
      if (!client) return;
      const request = ++sequence;
      try {
        const value = await client.activity({
          type: type || undefined,
          state: status || undefined,
          offset,
          limit: pageSize,
        });
        if (current && request === sequence) {
          setResult(value);
          setError('');
        }
      } catch (error) {
        if (current && request === sequence)
          setError(error instanceof Error ? error.message : '行动记录加载失败');
      }
    };
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, [client, type, status, offset]);
  return (
    <Panel>
      <h1>行动记录</h1>
      <div className="review-filters activity-filters">
        <NativeSelect
          aria-label="行动类型"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setOffset(0);
          }}
        >
          {Object.entries({
            '': '全部行动',
            dm: '私信',
            comments: '评论',
            search: '搜索',
            read: '阅读素材',
            diary: '日记',
            favorite: '收藏',
            task: '运行任务',
            feedback: '查看反馈',
          }).map(([value, label]) => (
            <NativeSelectOption value={value} key={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="行动结果"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setOffset(0);
          }}
        >
          <NativeSelectOption value="">全部结果</NativeSelectOption>
          {Object.entries(states).map(([value, label]) => (
            <NativeSelectOption value={value} key={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {error ? (
        <Empty>{error}</Empty>
      ) : !result ? (
        <Loading />
      ) : !result.items.length ? (
        <Empty>没有符合条件的行动记录。</Empty>
      ) : (
        <>
          <div className="activity-list">
            {result.items.map((row) => (
              <ActivityRow key={row.id} row={row} />
            ))}
          </div>
          <div className="activity-pagination">
            <span className="muted">
              {offset + 1}–{offset + result.items.length} / {result.total}
            </span>
            <Button
              variant="outline"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - pageSize))}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              disabled={offset + pageSize >= result.total}
              onClick={() => setOffset(offset + pageSize)}
            >
              下一页
            </Button>
          </div>
        </>
      )}
    </Panel>
  );
}
function ActivityRow({ row }: { row: Activity }) {
  const sent = ['share', 'reply', 'approve'].includes(row.action) && row.channel;
  const result = row.state === 'success' && sent ? '已发送' : states[row.state];
  return (
    <details className="activity-row">
      <summary>
        <time dateTime={row.at} title={new Date(row.at).toLocaleString('zh-CN')}>
          {formatTime(row.at)}
        </time>
        <span className="activity-heading">
          <strong>{row.summary}</strong>
          <span className="muted">
            {row.channel === 'dm' ? '私信 · ' : row.channel === 'comments' ? '评论 · ' : ''}
            {sources[row.source]}
            {row.targetName || row.targetMid ? ` · ${row.targetName || row.targetMid}` : ''}
          </span>
        </span>
        <span className={'activity-state ' + row.state}>{result}</span>
      </summary>
      <div className="activity-detail">
        {row.text ? (
          <p className="activity-body">{row.text}</p>
        ) : (
          sent && <p className="muted">这条历史记录未保存正文。</p>
        )}
        {row.textIncomplete && <p className="muted">历史正文不完整，只保留了当时的日志片段。</p>}
        {row.targetMid && (
          <p className="muted">
            接收对象：{row.targetName ? `${row.targetName} · ` : ''}UID {row.targetMid}
          </p>
        )}
        {row.error && <p className="activity-error">{row.error}</p>}
        {row.bvid && (
          <Link to="/videos" search={{ bv: row.bvid }} className="text-link">
            查看相关视频
          </Link>
        )}
        {row.action === 'diary' && (
          <Link to="/diary" className="text-link">
            查看日记
          </Link>
        )}
        {row.link &&
          /^https:\/\/www\.bilibili\.com\/video\/BV[0-9A-Za-z]{10}\/?#reply\d+$/.test(row.link) && (
            <a href={row.link} target="_blank" rel="noreferrer" className="text-link">
              查看已发评论
            </a>
          )}
        {row.finishedAt && <p className="muted">结束于 {formatTime(row.finishedAt)}</p>}
      </div>
    </details>
  );
}
