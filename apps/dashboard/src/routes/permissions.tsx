import { createFileRoute } from '@tanstack/react-router';
import { MessageSquare, Mail, PlayCircle, UserRound, UsersRound } from 'lucide-react';
import { useSettings } from '../lib/state';
import { Panel, Field, Input, Toggle, SaveBar, StatusBar, Loading } from '../components/common';
export const Route = createFileRoute('/permissions')({ component: Permissions });
function Permissions() {
  const settings = useSettings();
  const { config, setConfig } = settings;
  if (!config) return <Loading />;
  const s = config.share;
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
              ] as const
            ).map(([Icon, label, key]) => (
              <div className="permission-row" key={key}>
                <Icon />
                <Toggle
                  label={label}
                  checked={config.permissions[key]}
                  onChange={(value) =>
                    setConfig({ ...config, permissions: { ...config.permissions, [key]: value } })
                  }
                />
              </div>
            ))}
          </section>
          <section className="permission-explanation">
            <h2>消息回复</h2>
            <div>
              <UserRound />
              <div>
                <h3>主人消息可自动回复</h3>
                <p>根据已开启的权限回复。私信仅发送给已配置且互关的主人。</p>
              </div>
            </div>
            <div>
              <UsersRound />
              <div>
                <h3>其他人回复需要审核</h3>
                <p>回复先进入待我审核，由你批准后发送。</p>
              </div>
            </div>
          </section>
        </div>
        <section className="settings-section sharing-section">
          <Toggle
            label="主动分享"
            checked={s.enabled}
            onChange={(enabled) => setConfig({ ...config, share: { ...s, enabled } })}
          />
          <div className="form-columns four">
            <Field label="分享方式">
              <select
                disabled={!s.enabled}
                value={s.via}
                onChange={(e) =>
                  setConfig({ ...config, share: { ...s, via: e.target.value as 'comment' | 'dm' } })
                }
              >
                <option value="comment">发送评论</option>
                <option value="dm">发送私信</option>
              </select>
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
                  setConfig({ ...config, share: { ...s, silentAfterDays: Number(e.target.value) } })
                }
              />
            </Field>
          </div>
        </section>
      </Panel>
    </div>
  );
}
