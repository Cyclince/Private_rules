import { useState } from 'react';

export function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? '登录失败。');
      return;
    }
    window.location.href = '/admin';
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <span className="eyebrow">Private Rules</span>
        <h1>登录后台</h1>
        <p>请输入服务端配置的后台密码</p>
        <input
          autoComplete="current-password"
          autoFocus
          className="app-input"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="ADMIN_PASSWORD"
          type="password"
          value={password}
        />
        {error && <span className="form-error">{error}</span>}
        <button className="primary-action" disabled={!password.trim() || loading} type="submit">
          {loading ? '登录中...' : '进入后台'}
        </button>
      </form>
    </main>
  );
}
