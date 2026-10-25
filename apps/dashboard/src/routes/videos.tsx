import { createFileRoute } from '@tanstack/react-router';
import { Search, FileText, Image, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useDashboard, videosFrom, formatTime } from '../lib/state';
import { Panel, Empty, Loading, Cover, Input, BiliLink } from '../components/common';
export const Route = createFileRoute('/videos')({
  validateSearch: (search: Record<string, unknown>) => ({
    bv: typeof search.bv === 'string' ? search.bv : undefined,
  }),
  component: Videos,
});
function Videos() {
  const { state, loading } = useDashboard();
  const { bv } = Route.useSearch();
  const [query, setQuery] = useState(''),
    [selected, setSelected] = useState(bv ?? ''),
    [material, setMaterial] = useState('subtitles');
  if (!state) return loading ? <Loading /> : null;
  const all = videosFrom(state),
    filtered = all.filter((v) => (v.title + v.bvid).toLowerCase().includes(query.toLowerCase()));
  const video = all.find((v) => v.bvid === selected) ?? filtered[0];
  const actions = [
    ['subtitles', '字幕', FileText],
    ['frames', '画面', Image],
    ['comments', '评论', MessageSquare],
  ] as const;
  return (
    <div className="split-page video-page">
      <Panel className="list-panel">
        <h1>观看记录</h1>
        <label className="search-box">
          <Search size={21} />
          <Input
            aria-label="搜索视频标题或 BV 号"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索视频标题或 BV 号"
          />
        </label>
        {filtered.length ? (
          filtered.map((v) => (
            <button
              key={v.bvid}
              className={'video-list-item ' + (v.bvid === video?.bvid ? 'selected' : '')}
              onClick={() => setSelected(v.bvid)}
            >
              <Cover video={v} />
              <div>
                <strong>{v.title}</strong>
                <p>
                  {v.bvid} · {formatTime(v.at)}
                </p>
                <div className="material-badges">
                  {actions
                    .filter(([key]) => v.actions.includes(key))
                    .map(([key, label, Icon]) => (
                      <span key={key}>
                        <Icon size={15} />
                        {label}
                      </span>
                    ))}
                  {v.actions.includes('debrief') && <span>简报</span>}
                </div>
              </div>
            </button>
          ))
        ) : (
          <Empty>{query ? '没有匹配的观看记录。' : '小白龙还没出门逛过。'}</Empty>
        )}
      </Panel>
      <div className="page-stack detail-column">
        {video ? (
          <>
            <Panel>
              <Cover video={video} className="large-cover" />
              <h2 className="video-detail-title">{video.title}</h2>
              <p className="muted">
                {video.bvid} · {formatTime(video.at)}
              </p>
              <BiliLink bvid={video.bvid} />
            </Panel>
            <Panel className="materials-panel">
              <h2>小白龙读到的内容</h2>
              <div className="tabs">
                {actions.map(([key, label]) => (
                  <button
                    key={key}
                    className={key === material ? 'selected' : ''}
                    onClick={() => setMaterial(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {video.materials?.[material] ? (
                <pre className="material-text">{video.materials[material]}</pre>
              ) : (
                <Empty>
                  {video.actions.includes(material)
                    ? '这条历史记录未保存素材正文。'
                    : '尚未读取这类素材。'}
                </Empty>
              )}
              {video.materials?.debrief && (
                <details>
                  <summary>查看简报</summary>
                  <pre className="material-text">{video.materials.debrief}</pre>
                </details>
              )}
            </Panel>
          </>
        ) : (
          <Panel>
            <Empty>选择一条观看记录查看详情。</Empty>
          </Panel>
        )}
      </div>
    </div>
  );
}
