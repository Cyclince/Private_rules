import { useState } from 'react';
import type { RulesData } from '../../types/domain-rules';
import type { useDomainAdmin } from '../hooks/use-domain-admin';

export function SettingsPanel({
  api,
  data,
  theme,
  onThemeChange,
  onToast,
}: {
  api: ReturnType<typeof useDomainAdmin>;
  data: RulesData;
  theme: string;
  onThemeChange: (theme: string) => void;
  onToast: (message: string) => void;
}) {
  const [baseUrl, setBaseUrl] = useState(data.settings.baseUrl);
  const [policyName, setPolicyName] = useState(data.settings.policyName);
  const [publicLinksEnabled, setPublicLinksEnabled] = useState(data.settings.publicLinksEnabled);
  const [tokenLinksEnabled, setTokenLinksEnabled] = useState(data.settings.tokenLinksEnabled);
  const [importJson, setImportJson] = useState('');

  async function save() {
    await api.updateSettings({ baseUrl, policyName, publicLinksEnabled, tokenLinksEnabled });
    onToast('设置已保存');
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  async function exportData() {
    await navigator.clipboard.writeText(await api.exportData());
    onToast('备份数据已复制');
  }

  async function importData() {
    await api.importData(importJson);
    setImportJson('');
    onToast('数据已导入');
  }

  return (
    <div className="page-stack">
      <header className="section-head">
        <h1>设置</h1>
        <p>只展示日常会用到的配置，敏感信息不会显示原文。</p>
      </header>
      <section className="soft-card input-panel">
        <label>
          <span>站点基础 URL</span>
        <input className="app-input" placeholder="https://example.com" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
        </label>
        <label>
          <span>默认策略组名称，可留空</span>
          <input className="app-input" placeholder="留空时不强制写 Proxy 或 Direct" value={policyName} onChange={(event) => setPolicyName(event.target.value)} />
        </label>
        <label className="check-row">
          <input checked={publicLinksEnabled} type="checkbox" onChange={(event) => setPublicLinksEnabled(event.target.checked)} />
          <span>启用公开链接</span>
        </label>
        <label className="check-row">
          <input checked={tokenLinksEnabled} type="checkbox" onChange={(event) => setTokenLinksEnabled(event.target.checked)} />
          <span>启用 Token 链接</span>
        </label>
        <label>
          <span>主题</span>
          <select className="app-input" value={theme} onChange={(event) => onThemeChange(event.target.value)}>
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </label>
        <button className="primary-action" onClick={save}>保存设置</button>
      </section>
      <section className="soft-card">
        <h2>数据导入 / 导出</h2>
        <p>当前规则保存在 Cloudflare D1。导出内容可作为备份，也可以导入到新的 D1 数据库。</p>
        <div className="card-actions">
          <button onClick={exportData}>复制备份</button>
        </div>
        <textarea
          className="app-input textarea"
          placeholder="粘贴备份 JSON 后导入"
          value={importJson}
          onChange={(event) => setImportJson(event.target.value)}
        />
        <button className="ghost-action" disabled={!importJson.trim()} onClick={importData}>导入备份</button>
      </section>
      <section className="soft-card">
        <h2>链接说明</h2>
        <p>Token 链接用于隐藏规则地址；公开链接方便测试。Token 泄露后别人也可以访问对应规则。</p>
      </section>
      <section className="soft-card">
        <h2>敏感配置</h2>
        <p>后台密码、订阅 Token 和 Session 密钥都来自 Cloudflare Secrets，只显示配置状态，不显示明文。</p>
        <div className="status-list">
          <span>D1 数据库：{api.meta.d1Ready ? '已连接' : '未连接'}</span>
          <span>后台密码：{api.meta.passwordConfigured ? '已配置' : '未配置'}</span>
          <span>RULE_TOKEN：{api.meta.ruleTokenConfigured ? '已配置' : '未配置'}</span>
          <span>SESSION_SECRET：{api.meta.sessionSecretConfigured ? '已配置' : '未配置'}</span>
        </div>
        <button className="ghost-action" onClick={logout}>退出登录</button>
      </section>
    </div>
  );
}
