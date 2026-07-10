import { useEffect, useMemo, useState } from 'react';
import type { RuleCategory } from '../../types/domain-rules';
import { useDomainAdmin } from '../hooks/use-domain-admin';
import { AboutPanel } from './about-panel';
import { DashboardPanel } from './dashboard-panel';
import { LinksPanel } from './links-panel';
import { RulesPanel } from './rules-panel';
import { SettingsPanel } from './settings-panel';

type View = 'dashboard' | 'rules' | 'links' | 'settings' | 'about';

const NAV: { id: View; label: string }[] = [
  { id: 'dashboard', label: '首页' },
  { id: 'rules', label: '域名' },
  { id: 'links', label: '链接' },
  { id: 'settings', label: '设置' },
  { id: 'about', label: '关于' },
];

export function DomainAdmin() {
  const api = useDomainAdmin();
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string>('');
  const [theme, setTheme] = useState('system');
  const [toast, setToast] = useState('');

  const selectedCategory = useMemo(
    () => api.data?.categories.find((category) => category.id === selectedId) ?? api.data?.categories[0],
    [api.data?.categories, selectedId],
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }

  function openCategory(category: RuleCategory) {
    setSelectedId(category.id);
    setView('rules');
  }

  useEffect(() => {
    setTheme(localStorage.getItem('rule-admin-theme') ?? 'system');
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      localStorage.setItem('rule-admin-theme', theme);
    };
    applyTheme();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <div className="sidebar-brand">
          <span className="app-mark">Rules</span>
          <strong>域名管理</strong>
        </div>
        {NAV.map((item) => (
          <button className={`nav-item ${view === item.id ? 'active' : ''}`} key={item.id} onClick={() => setView(item.id)}>
            {item.label}
          </button>
        ))}
      </aside>
      <main className="app-main">
        {api.loading || !api.data ? (
          <div className="skeleton-card" />
        ) : (
          <>
            {view === 'dashboard' && (
              <DashboardPanel data={api.data} links={api.links} onOpenCategory={openCategory} onToast={showToast} />
            )}
            {view === 'rules' && selectedCategory && (
              <RulesPanel
                api={api}
                categories={api.data.categories}
                category={selectedCategory}
                onSelectCategory={setSelectedId}
                onToast={showToast}
              />
            )}
            {view === 'links' && <LinksPanel data={api.data} links={api.links} onToast={showToast} />}
            {view === 'settings' && (
              <SettingsPanel api={api} data={api.data} onThemeChange={setTheme} onToast={showToast} theme={theme} />
            )}
            {view === 'about' && <AboutPanel />}
          </>
        )}
      </main>
      <nav className="bottom-nav">
        {NAV.map((item) => (
          <button className={view === item.id ? 'active' : ''} key={item.id} onClick={() => setView(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
      {toast && <div className="app-toast">{toast}</div>}
    </div>
  );
}
