import { useEffect, useState } from 'react';
import type { DashboardClient } from '../lib/dashboard-store';
import { useDashboard } from '../lib/state';
import { Empty, Loading } from './common';

type Material = Awaited<ReturnType<DashboardClient['material']>>;
export function MaterialContent({
  bvid,
  kind,
  revision,
}: {
  bvid: string;
  kind: 'subtitles' | 'comments' | 'frames' | 'debrief';
  revision?: string;
}) {
  const client = useDashboard((state) => state.client);
  const [result, setResult] = useState<Material | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    setResult(null);
    setError('');
    if (client)
      void client
        .material({ bvid, kind })
        .then((value) => {
          if (current) setResult(value);
        })
        .catch((error: unknown) => {
          if (current) setError(error instanceof Error ? error.message : '素材加载失败');
        });
    return () => {
      current = false;
    };
  }, [client, bvid, kind, revision]);
  if (error) return <Empty>{error}</Empty>;
  if (!result) return <Loading />;
  if (result.state !== 'ready')
    return (
      <Empty>
        {result.message ||
          {
            unread: kind === 'frames' ? '没有抽取过这个视频的画面。' : '尚未读取这类素材。',
            failed: '上次读取失败。',
            missing: '读取记录仍在，但素材缓存缺失或不完整。',
            empty: kind === 'subtitles' ? '这个视频没有可用字幕。' : '本次没有读到评论。',
          }[result.state]}
      </Empty>
    );
  return (
    <div className="material-content">
      {result.subtitles && (
        <>
          {result.total && result.subtitles.length < result.total ? (
            <p className="muted">
              读到了 {result.subtitles.length} 行，字幕共 {result.total} 行。
            </p>
          ) : null}
          <div className="subtitle-lines">
            {result.subtitles.map((line, i) => (
              <p key={i}>
                <time>{line.time}</time>
                <span>{line.text}</span>
              </p>
            ))}
          </div>
        </>
      )}
      {result.comments && (
        <div className="material-comments">
          {result.comments.map((comment) => (
            <article key={comment.id}>
              <div className="material-comment-meta">
                <strong>{comment.author}</strong>
                <span>{comment.time}</span>
                {comment.likes > 0 && <span>{comment.likes} 赞</span>}
              </div>
              <p>{comment.text}</p>
            </article>
          ))}
        </div>
      )}
      {result.images && (
        <div className="material-images">
          {result.times && <p className="muted">{result.times}</p>}
          {result.images.map((image, i) => (
            <figure key={i}>
              <img src={image.dataUrl} alt={image.label} />
              <figcaption>{image.label}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {result.text && <p className="material-text">{result.text}</p>}
    </div>
  );
}
