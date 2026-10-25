import { Textarea } from '../components/ui/textarea';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { X, Plus, NotebookText } from 'lucide-react';
import { useSettings, useDashboard } from '../lib/state';
import { Panel, Field, Input, SaveBar, Loading } from '../components/common';
import { Button } from '../components/ui/button';
export const Route = createFileRoute('/personality')({ component: Personality });
function KeywordEditor({
  title,
  values,
  onChange,
}: {
  title: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [adding, setAdding] = useState(false),
    [text, setText] = useState('');
  function add() {
    const next = text.trim();
    if (next && !values.includes(next)) {
      onChange([...values, next].slice(0, 20));
    }
    setText('');
    setAdding(false);
  }
  return (
    <div className="keyword-editor">
      <div className="section-heading">
        <h3>{title}</h3>
        <Button variant="ghost" disabled={values.length >= 20} onClick={() => setAdding(true)}>
          <Plus size={15} />
          添加关键词
        </Button>
      </div>
      <div className="tags removable">
        {values.map((v) => (
          <span key={v}>
            {v}
            <Button
              variant="ghost"
              aria-label={'移除' + v}
              onClick={() => onChange(values.filter((x) => x !== v))}
            >
              <X size={14} />
            </Button>
          </span>
        ))}
      </div>
      {adding && (
        <div className="keyword-input">
          <Input
            autoFocus
            aria-label={title + '新增关键词'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
              if (e.key === 'Escape') setAdding(false);
            }}
          />
          <Button onClick={add}>添加</Button>
        </div>
      )}
    </div>
  );
}
function Personality() {
  const settings = useSettings();
  const { config, setConfig } = settings;
  const { state } = useDashboard((s) => ({ state: s.state }));
  if (!config) return <Loading />;
  const p = config.persona;
  return (
    <div className="settings-grid">
      <Panel className="settings-main">
        <h1>个性与兴趣</h1>
        <section className="settings-section">
          <h2>基础设置</h2>
          {(
            [
              ['name', '小白龙的名字'],
              ['selfClaim', '自称'],
              ['ownerTitle', '对你的称呼'],
              ['diaryTitle', '写给你的日记标题'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                value={p[key]}
                maxLength={2000}
                onChange={(e) => setConfig({ ...config, persona: { ...p, [key]: e.target.value } })}
              />
            </Field>
          ))}
          <Field label="性格描述">
            <Textarea
              value={p.body}
              maxLength={20000}
              rows={6}
              onChange={(e) => setConfig({ ...config, persona: { ...p, body: e.target.value } })}
            />
          </Field>
        </section>
        <section className="settings-section">
          <h2>兴趣偏好</h2>
          <div className="keyword-grid">
            <KeywordEditor
              title="喜欢的内容关键词"
              values={config.preferences.like}
              onChange={(like) =>
                setConfig({ ...config, preferences: { ...config.preferences, like } })
              }
            />
            <KeywordEditor
              title="不喜欢的内容关键词"
              values={config.preferences.dislike}
              onChange={(dislike) =>
                setConfig({ ...config, preferences: { ...config.preferences, dislike } })
              }
            />
          </div>
        </section>
        <SaveBar {...settings} />
      </Panel>
      <Panel className="preview-panel">
        <h2>预览</h2>
        <div className="persona-preview">
          <h3>{p.name}</h3>
          <p>{p.body}</p>
        </div>
        <section className="content-divider">
          <h3>
            <NotebookText size={20} />
            {p.diaryTitle}
          </h3>
          <p className="preview-prose">
            {state?.diaries.at(-1)?.publicText || `写给${p.ownerTitle}的日记会以这个标题显示。`}
          </p>
        </section>
      </Panel>
    </div>
  );
}
