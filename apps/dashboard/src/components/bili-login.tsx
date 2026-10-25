import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import type { ApiRouter } from '@bili-dragon/runtime/api';
import type { RouterClient } from '@orpc/server';
import { useDashboard } from '../lib/state';
import { Field, Input } from './common';
import { Button } from './ui/button';

type Client = RouterClient<ApiRouter>;
type Qr = Awaited<ReturnType<Client['loginStart']>>;
type Account = NonNullable<Awaited<ReturnType<Client['checkLogin']>>['account']>;
type Phase = 'loading' | 'waiting' | 'scanned' | 'connected' | 'expired' | 'error';

export function BiliLogin() {
  const { client, state, busy, perform, refresh } = useDashboard((s) => ({
    client: s.client,
    state: s.state,
    busy: s.busy,
    perform: s.perform,
    refresh: s.refresh,
  }));
  const [phase, setPhase] = useState<Phase>('loading');
  const [qr, setQr] = useState<Qr | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState('');
  const [credentials, setCredentials] = useState({ sessdata: '', bili_jct: '', buvid3: '' });
  const [revealed, setRevealed] = useState(false);
  const generation = useRef(0),
    handle = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initiallyConfigured = useRef(state?.hasCredentials ?? false);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const cancel = useCallback(() => {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (handle.current && client)
      void client.loginCancel({ handle: handle.current }).catch(() => {});
    handle.current = null;
  }, [client]);

  const start = useCallback(async () => {
    if (!client) return;
    cancel();
    const current = generation.current;
    setPhase('loading');
    setQr(null);
    setError('');
    setSavedNotice('');
    try {
      const next = await client.loginStart();
      if (current !== generation.current) {
        void client.loginCancel({ handle: next.handle }).catch(() => {});
        return;
      }
      handle.current = next.handle;
      setQr(next);
      setPhase('waiting');
      const poll = async () => {
        if (current !== generation.current) return;
        try {
          const result = await client.loginPoll({ handle: next.handle });
          if (current !== generation.current) return;
          if (result.status === 'success' && result.account) {
            handle.current = null;
            setQr(null);
            setAccount(result.account);
            setPhase('connected');
            setSavedNotice('已连接，活动已暂停');
            void refreshRef.current();
          } else if (result.status === 'waiting' || result.status === 'scanned') {
            setPhase(result.status);
            timer.current = setTimeout(() => void poll(), 2000);
          } else {
            handle.current = null;
            setPhase('expired');
            setQr(null);
          }
        } catch (cause) {
          if (current !== generation.current) return;
          handle.current = null;
          setQr(null);
          setPhase('error');
          setError(cause instanceof Error ? cause.message : '扫码登录失败，请重试');
        }
      };
      timer.current = setTimeout(() => void poll(), 2000);
    } catch (cause) {
      if (current !== generation.current) return;
      setPhase('error');
      setError(cause instanceof Error ? cause.message : '无法获取二维码，请重试');
    }
  }, [client, cancel]);

  const check = useCallback(async () => {
    if (!client) return;
    cancel();
    const current = generation.current;
    setPhase('loading');
    setError('');
    setSavedNotice('');
    setQr(null);
    try {
      const result = await client.checkLogin();
      if (current !== generation.current) return;
      if (result.status === 'connected' && result.account) {
        setAccount(result.account);
        setPhase('connected');
        void refreshRef.current();
      } else {
        setAccount(null);
        await start();
      }
    } catch (cause) {
      if (current !== generation.current) return;
      setPhase('error');
      setError(cause instanceof Error ? cause.message : '检查连接失败，请重试');
    }
  }, [client, cancel, start]);

  useEffect(() => {
    if (initiallyConfigured.current) void check();
    else void start();
    return cancel;
  }, [check, start, cancel]);

  async function saveCredentials() {
    cancel();
    setQr(null);
    if (await perform((c) => c.credentials(credentials), '凭据已保存，活动已暂停')) {
      setCredentials({ sessdata: '', bili_jct: '', buvid3: '' });
      await check();
    } else {
      setPhase('error');
      setError('未能保存凭据，请检查输入后重试');
    }
  }

  return (
    <>
      <div className="section-heading">
        <h2>B 站账号</h2>
        {phase === 'connected' && (
          <Button variant="outline" disabled={busy} onClick={() => void check()}>
            <RefreshCw size={16} />
            检查连接
          </Button>
        )}
      </div>
      {phase === 'connected' && account ? (
        <div className="account-status">
          {account.avatar && (
            <img
              className="account-avatar"
              src={account.avatar}
              alt=""
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <h2>{account.name}</h2>
            <p className="muted">UID {account.uid}</p>
          </div>
          <Button variant="outline" disabled={busy} onClick={() => void start()}>
            重新扫码登录
          </Button>
        </div>
      ) : (
        <div className="qr-login" aria-live="polite">
          {qr && (
            <img
              className="login-qr"
              src={qr.image}
              width={240}
              height={240}
              alt="B 站登录二维码"
            />
          )}
          {phase === 'loading' && <p>正在连接 B 站…</p>}
          {phase === 'waiting' && <p>使用 B 站 App 扫码登录</p>}
          {phase === 'scanned' && <p>扫码成功，请在手机上确认</p>}
          {phase === 'expired' && <p>二维码已失效</p>}
          {error && <p role="alert">{error}</p>}
          {phase !== 'loading' && (
            <Button variant="outline" disabled={busy} onClick={() => void start()}>
              <RefreshCw size={16} />
              {phase === 'error' ? '重新获取二维码' : '刷新二维码'}
            </Button>
          )}
        </div>
      )}
      {savedNotice && (
        <p className="muted" role="status">
          {savedNotice}
        </p>
      )}
      <Collapsible className="manual-login">
        <CollapsibleTrigger className="disclosure-trigger">高级选项</CollapsibleTrigger>
        <CollapsibleContent>
          <div className="section-heading">
            <h3>手动 Cookie</h3>
            <Button
              variant="ghost"
              size="icon"
              aria-label={revealed ? '隐藏输入' : '显示输入'}
              onClick={() => setRevealed(!revealed)}
            >
              {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
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
                placeholder={state?.hasCredentials ? '已保存；填写以替换' : ''}
                onChange={(e) => setCredentials({ ...credentials, [key]: e.target.value })}
              />
            </Field>
          ))}
          <p className="muted">在 B 站网页端登录后，从浏览器开发者工具的 Cookie 中复制这三个值。</p>
          <div className="save-bar">
            <Button
              disabled={busy || Object.values(credentials).some((value) => !value.trim())}
              onClick={() => void saveCredentials()}
            >
              保存凭据
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
