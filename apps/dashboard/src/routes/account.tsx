import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../components/ui/collapsible';
import { NativeSelect, NativeSelectOption } from '../components/ui/native-select';
import { createFileRoute } from '@tanstack/react-router';
import { useSettings, useDashboard } from '../lib/state';
import { Panel, Field, Input, SaveBar, Loading } from '../components/common';
import { BiliLogin } from '../components/bili-login';
export const Route = createFileRoute('/account')({ component: Account });
function Account() {
  const settings = useSettings();
  const { config, setConfig } = settings;
  const { state } = useDashboard((s) => ({ state: s.state }));
  if (!config || !state) return <Loading />;
  return (
    <div className="page-stack account-page">
      <div className="page-stack">
        <h1 className="page-title">账号连接</h1>
        <Panel>
          <BiliLogin />
        </Panel>
        <Panel>
          <h2>账号模式</h2>
          <NativeSelect
            aria-label="账号模式"
            value={
              config.accountMode ??
              (state.account && config.owner.mid && config.owner.mid !== state.account.uid
                ? 'dual'
                : 'single')
            }
            onChange={(event) => {
              const accountMode = event.target.value as 'single' | 'dual';
              const owner =
                accountMode === 'single' && state.account
                  ? { mid: state.account.uid, name: state.account.name }
                  : config.owner.mid === state.account?.uid
                    ? { mid: '', name: '' }
                    : config.owner;
              setConfig({ ...config, accountMode, owner });
            }}
          >
            <NativeSelectOption value="single">单号模式 · 使用自己的账号</NativeSelectOption>
            <NativeSelectOption value="dual">双号模式 · 小白龙使用小号</NativeSelectOption>
          </NativeSelect>
          {config.accountMode === 'dual' && (
            <>
              <Field label="主人 UID">
                <Input
                  inputMode="numeric"
                  value={config.owner.mid}
                  onChange={(e) =>
                    setConfig({ ...config, owner: { ...config.owner, mid: e.target.value } })
                  }
                />
              </Field>
              {state.account && config.owner.mid === state.account.uid && (
                <p className="error-text">主人 UID 需要与登录账号不同。</p>
              )}
              <Field label="主人 B 站昵称（评论 @ 用）">
                <Input
                  value={config.owner.name}
                  onChange={(e) =>
                    setConfig({ ...config, owner: { ...config.owner, name: e.target.value } })
                  }
                />
              </Field>
            </>
          )}
        </Panel>
        <Panel>
          <Collapsible>
            <CollapsibleTrigger className="disclosure-trigger">高级设置</CollapsibleTrigger>
            <CollapsibleContent>
              <p className="muted">
                登录信息只保存在这台电脑上，并用于连接 B 站。登录失效时，重新扫码即可。
              </p>
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
            </CollapsibleContent>
          </Collapsible>
          <SaveBar {...settings} />
        </Panel>
      </div>
    </div>
  );
}
