import { NativeSelect, NativeSelectOption } from '../components/ui/native-select';
import { createFileRoute } from '@tanstack/react-router';
import { MessageSquare, Mail, PlayCircle, Bookmark } from 'lucide-react';
import { useSettings } from '../lib/state';
import { Panel, Field, Input, Toggle, SaveBar, StatusBar, Loading } from '../components/common';
export const Route = createFileRoute('/permissions')({ component: Permissions });
function Permissions() {
  const settings = useSettings();
  const { config, setConfig } = settings;
  if (!config) return <Loading />;
  const s = config.share;
  const single = config.accountMode === 'single';
  return (
    <div className="page-stack">
      <StatusBar />
      <Panel className="permissions-page">
        <div className="section-heading">
          <h1>操作权限</h1>
          <SaveBar {...settings} />
        </div>
        <div className="permissions-grid">
          <section>
            <h2>互动权限</h2>
            {(
              [
                [MessageSquare, '发送评论', 'comments'],
                [Mail, '发送私信', 'dm'],
                [PlayCircle, '发送直播弹幕', 'live'],
                [Bookmark, '自动收藏', 'favorites'],
              ] as const
            ).map(([Icon, label, key]) => (
              <div className="permission-row" key={key}>
                <Icon />
                <Toggle
                  label={label}
                  checked={config.permissions[key]}
                  disabled={single && key === 'dm'}
                  description={
                    single && key === 'dm'
                      ? '单号模式不能给自己发私信；使用双号模式可发送给主人。'
                      : undefined
                  }
                  onChange={(value) =>
                    setConfig({ ...config, permissions: { ...config.permissions, [key]: value } })
                  }
                />
              </div>
            ))}
          </section>
          <section className="permission-explanation">
            <h2>消息回复</h2>
            <p className="muted">
              {single
                ? '给其他人的回复，都会先交给你审核。'
                : '小白龙会按权限回复你。给其他人的回复先交给你审核；私信只发给已互关的主人。'}
            </p>
          </section>
        </div>
        <section className="settings-section sharing-section">
          <Toggle
            label="主动分享"
            checked={s.enabled}
            disabled={single}
            description={single ? '小白龙会把逛到的内容记在观看记录和日记里。' : undefined}
            onChange={(enabled) => setConfig({ ...config, share: { ...s, enabled } })}
          />
          {!single && s.enabled && (
            <div className="form-columns four">
              <Field label="分享方式">
                <NativeSelect
                  disabled={!s.enabled}
                  value={s.via}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      share: { ...s, via: e.target.value as 'comment' | 'dm' },
                    })
                  }
                >
                  <NativeSelectOption value="comment">发送评论</NativeSelectOption>
                  <NativeSelectOption value="dm">发送私信</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field label="最低分享评分">
                <Input
                  disabled={!s.enabled}
                  type="number"
                  min={0}
                  max={20}
                  value={s.minScore}
                  onChange={(e) =>
                    setConfig({ ...config, share: { ...s, minScore: Number(e.target.value) } })
                  }
                />
              </Field>
              <Field label="每日最多分享数">
                <Input
                  disabled={!s.enabled}
                  type="number"
                  min={0}
                  max={3}
                  value={config.quota.shareDaily}
                  onChange={(e) =>
                    setConfig({ ...config, quota: { shareDaily: Number(e.target.value) } })
                  }
                />
              </Field>
              <Field label="无人回应后减少分享（天）">
                <Input
                  disabled={!s.enabled}
                  type="number"
                  min={1}
                  max={30}
                  value={s.silentAfterDays}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      share: { ...s, silentAfterDays: Number(e.target.value) },
                    })
                  }
                />
              </Field>
            </div>
          )}
        </section>
      </Panel>
    </div>
  );
}
