import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useSettings, useDashboard } from '../lib/state';
import { Panel, Field, Input, SaveBar, Loading } from '../components/common';
import { Button } from '../components/ui/button';
export const Route = createFileRoute('/account')({ component: Account });
function Account() {
  const settings = useSettings();
  const { config, setConfig } = settings;
  const { state, busy, perform } = useDashboard();
  const [credentials, setCredentials] = useState({ sessdata: '', bili_jct: '', buvid3: '' }),
    [revealed, setRevealed] = useState(false),
    [check, setCheck] = useState('');
  if (!config || !state) return <Loading />;
  async function saveCredentials() {
    if (await perform((c) => c.credentials(credentials), '凭据已保存'))
      setCredentials({ sessdata: '', bili_jct: '', buvid3: '' });
  }
  async function checkLogin() {
    await perform(async (c) => {
      const r = await c.checkLogin();
      const text = r.content
        .filter((x) => x.type === 'text')
        .map((x) => x.text)
        .join('\n');
      if (r.isError) throw Error(text);
      setCheck(text);
    });
  }
  return (
    <div className="settings-grid account-page">
      <div className="page-stack">
        <Panel>
          <h1>账号连接</h1>
        </Panel>
        <Panel>
          <h2>B 站账号状态</h2>
          <div className="account-status">
            <span className={'status-light ' + (state.hasCredentials ? 'online' : 'paused')} />
            <div>
              <h2>{state.hasCredentials ? '已配置' : '未连接'}</h2>
              <p className="muted">
                {state.hasCredentials ? '可检查会话是否有效' : '填写凭据后保存连接'}
              </p>
            </div>
            <Button disabled={busy || !state.hasCredentials} onClick={() => void checkLogin()}>
              <RefreshCw size={18} />
              检查会话
            </Button>
          </div>
          {check && (
            <details>
              <summary>本次检查结果</summary>
              <pre className="material-text">{check}</pre>
            </details>
          )}
        </Panel>
        <Panel>
          <div className="section-heading">
            <h2>账号凭据</h2>
            <button
              className="icon-button"
              aria-label={revealed ? '隐藏输入' : '显示输入'}
              onClick={() => setRevealed(!revealed)}
            >
              {revealed ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {(
            [
              ['sessdata', 'SESSDATA'],
              ['bili_jct', 'bili_jct'],
              ['buvid3', 'buvid3'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                type={revealed ? 'text' : 'password'}
                autoComplete="off"
                value={credentials[key]}
                placeholder={state.hasCredentials ? '已保存；填写以替换' : ''}
                onChange={(e) => setCredentials({ ...credentials, [key]: e.target.value })}
              />
            </Field>
          ))}
          <div className="save-bar">
            <Button
              disabled={busy || Object.values(credentials).some((v) => !v.trim())}
              onClick={() => void saveCredentials()}
            >
              保存凭据
            </Button>
          </div>
        </Panel>
        <Panel>
          <h2>主人信息</h2>
          <Field label="主人 UID">
            <Input
              inputMode="numeric"
              value={config.owner.mid}
              onChange={(e) =>
                setConfig({ ...config, owner: { ...config.owner, mid: e.target.value } })
              }
            />
          </Field>
          <Field label="称呼">
            <Input
              value={config.owner.name}
              onChange={(e) =>
                setConfig({ ...config, owner: { ...config.owner, name: e.target.value } })
              }
            />
          </Field>
        </Panel>
        <Panel>
          <details>
            <summary>高级设置</summary>
            <Field label="Codex 可执行文件路径">
              <Input
                value={config.codexPath}
                placeholder="自动检测"
                onChange={(e) => setConfig({ ...config, codexPath: e.target.value })}
              />
            </Field>
            <Field label="模型名称（可选）">
              <Input
                value={config.model}
                placeholder="使用 Codex 默认模型"
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
              />
            </Field>
          </details>
          <SaveBar {...settings} />
        </Panel>
      </div>
      <aside className="page-stack">
        <Panel>
          <h2>连接步骤</h2>
          <ol className="connection-steps">
            <li>在 B 站网页端登录账号。</li>
            <li>在浏览器开发者工具中查看 Cookie，取得 SESSDATA、bili_jct、buvid3。</li>
            <li>填写并保存凭据，然后检查会话。</li>
          </ol>
        </Panel>
        <Panel>
          <h2>凭据保存</h2>
          <p className="muted">
            凭据保存在本机，仅发送给 B 站接口。管理页和模型工具不会回读已保存的值。
          </p>
          <details>
            <summary>连接失败时</summary>
            <p className="muted">会话可能已失效。重新登录 B 站并更新这三个值，再检查会话。</p>
          </details>
        </Panel>
      </aside>
    </div>
  );
}
