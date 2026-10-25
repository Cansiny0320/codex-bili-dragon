import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../components/ui/collapsible';
import { ModelSettings } from '../components/model-settings';
import { NativeSelect, NativeSelectOption } from '../components/ui/native-select';
import { createFileRoute } from '@tanstack/react-router';
import { MessageSquare, Mail, PlayCircle, Bookmark } from 'lucide-react';
import { useSettings, useDashboard } from '../lib/state';
import { Panel, Field, Input, Toggle, SaveBar, StatusBar, Loading } from '../components/common';
export const Route = createFileRoute('/permissions')({ component: Permissions });
function Permissions() {
  const settings = useSettings();
  const { config, setConfig } = settings;
  const { state } = useDashboard((s) => ({ state: s.state }));
  if (!config || !state) return <Loading />;
  const s = config.share;
  const l = config.listen;
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
        <section className="settings-section">
          <h2>留意新消息</h2>
          <div className="form-columns">
            {(
              [
                ['comment', '评论'],
                ['dm', '私信'],
                ['live', '直播弹幕'],
              ] as const
            ).map(([key, label]) => (
              <Toggle
                key={key}
                label={label}
                checked={l[key]}
                onChange={(value) => setConfig({ ...config, listen: { ...l, [key]: value } })}
              />
            ))}
          </div>
          {(l.comment || l.dm || l.live) && (
            <Collapsible className="listener-details">
              <CollapsibleTrigger className="disclosure-trigger">消息设置</CollapsibleTrigger>
              <CollapsibleContent>
                <div className="form-columns">
                  {l.comment && (
                    <Field label="检查评论的间隔（秒）">
                      <Input
                        type="number"
                        min={60}
                        max={3600}
                        value={l.commentIntervalSec}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            listen: { ...l, commentIntervalSec: Number(e.target.value) },
                          })
                        }
                      />
                    </Field>
                  )}
                  {l.dm && (
                    <Field label="检查私信的间隔（秒）">
                      <Input
                        type="number"
                        min={60}
                        max={3600}
                        value={l.dmIntervalSec}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            listen: { ...l, dmIntervalSec: Number(e.target.value) },
                          })
                        }
                      />
                    </Field>
                  )}
                  {l.live && (
                    <Field label="直播间号">
                      <Input
                        inputMode="numeric"
                        value={l.liveRoom}
                        onChange={(e) =>
                          setConfig({ ...config, listen: { ...l, liveRoom: e.target.value } })
                        }
                      />
                    </Field>
                  )}
                </div>
                <div className="listener-options">
                  {l.live && (
                    <Field label="留意哪些弹幕">
                      <NativeSelect
                        value={l.liveScope}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            listen: { ...l, liveScope: e.target.value as 'owner' | 'mention' },
                          })
                        }
                      >
                        <NativeSelectOption value="owner">仅主人</NativeSelectOption>
                        <NativeSelectOption value="mention">
                          只看提到小白龙的消息
                        </NativeSelectOption>
                      </NativeSelect>
                    </Field>
                  )}
                  <Toggle
                    label="活动时间外也留意消息"
                    checked={l.allDay}
                    onChange={(allDay) => setConfig({ ...config, listen: { ...l, allDay } })}
                  />
                  <Toggle
                    label="每人只回一次"
                    checked={l.oncePerPerson}
                    onChange={(oncePerPerson) =>
                      setConfig({ ...config, listen: { ...l, oncePerPerson } })
                    }
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </section>
        <section className="settings-section">
          <Toggle
            label="自动更新小白龙"
            checked={config.updates.enabled}
            disabled={!state.updates.supported}
            description={
              state.updates.supported
                ? '每六小时检查稳定版；兼容更新在空闲时生效。'
                : '自动更新仅支持 Codex 共享后台，前台开发模式不自动切换。'
            }
            onChange={(enabled) => setConfig({ ...config, updates: { enabled } })}
          />
          <p className="muted">后台版本 {state.updates.runtimeVersion}</p>
          {state.updates.message && <p role="status">{state.updates.message}</p>}
        </section>
        <ModelSettings config={config} setConfig={setConfig} />
      </Panel>
    </div>
  );
}
