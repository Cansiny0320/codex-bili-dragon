import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, NotebookText } from 'lucide-react';
import { useDashboard, videosFrom } from '../lib/state';
import { Panel, Empty, Loading, Cover, VideoCard } from '../components/common';
export const Route = createFileRoute('/diary')({ component: Diaries });
function Diaries() {
  const { state, loading } = useDashboard((s) => ({ state: s.state, loading: s.loading }));
  const [privateDiary, setPrivate] = useState(false),
    [selected, setSelected] = useState(''),
    [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  if (!state) return loading ? <Loading /> : null;
  const videos = videosFrom(state);
  const entries = [...state.diaries].reverse().filter((d) => d.at.slice(0, 7) === month);
  const diary = entries.find((d) => d.id === selected) ?? entries[0];
  const moveMonth = (delta: number) => {
    const d = new Date(month + '-01T12:00:00');
    d.setMonth(d.getMonth() + delta);
    setMonth(d.toISOString().slice(0, 7));
  };
  return (
    <Tabs
      value={privateDiary ? 'private' : 'public'}
      onValueChange={(value) => setPrivate(value === 'private')}
      className="split-page diary-page"
    >
      <Panel className="list-panel">
        <h2>日记</h2>
        <div className="month-picker">
          <Button variant="ghost" size="icon" aria-label="上个月" onClick={() => moveMonth(-1)}>
            <ChevronLeft size={19} />
          </Button>
          <Input
            type="month"
            aria-label="日记月份"
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
          <Button variant="ghost" size="icon" aria-label="下个月" onClick={() => moveMonth(1)}>
            <ChevronRight size={19} />
          </Button>
        </div>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="public">给我的信</TabsTrigger>
          <TabsTrigger value="private">内心日记</TabsTrigger>
        </TabsList>
        {entries.length ? (
          entries.map((d) => (
            <Button
              variant="ghost"
              key={d.id}
              className={
                'diary-list-item h-auto justify-start whitespace-normal ' +
                (diary?.id === d.id ? 'selected' : '')
              }
              onClick={() => setSelected(d.id)}
            >
              {d.bvid && <Cover video={videos.find((v) => v.bvid === d.bvid) ?? {}} />}
              <div>
                <small>
                  {new Date(d.at).toLocaleDateString('zh-CN', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </small>
                <strong>
                  <NotebookText size={17} />
                  {d.title}
                </strong>
                <p>{privateDiary ? d.privateText : d.publicText}</p>
              </div>
            </Button>
          ))
        ) : (
          <Empty>这个月还没有日记。</Empty>
        )}
      </Panel>
      <TabsContent value={privateDiary ? 'private' : 'public'} className="min-w-0">
        <Panel className="diary-reading">
          {diary ? (
            <>
              <div className="diary-meta">
                <NotebookText />
                {privateDiary ? '内心日记' : state.config.persona.diaryTitle}
                <span>·</span>
                {new Date(diary.at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </div>
              <h1>{diary.title}</h1>
              <div className="diary-prose">
                {(privateDiary ? diary.privateText : diary.publicText).split(/\n+/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {diary.bvid && (
                <section className="content-divider">
                  <h2>相关视频</h2>
                  <div className="related-videos">
                    {videos
                      .filter((v) => v.bvid === diary.bvid)
                      .map((v) => (
                        <VideoCard key={v.bvid} video={v} />
                      ))}
                  </div>
                </section>
              )}
              <section className="content-divider">
                <h2>素材依据</h2>
                <p className="evidence-note">{diary.evidence}</p>
              </section>
            </>
          ) : (
            <Empty>选择一篇日记阅读。</Empty>
          )}
        </Panel>
      </TabsContent>
    </Tabs>
  );
}
