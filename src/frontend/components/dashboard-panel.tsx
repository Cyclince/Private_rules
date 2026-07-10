import { useState } from 'react';
import type { ClientLink, RuleCategory, RulesData } from '../../types/domain-rules';
import { LinkSheet } from './link-sheet';

export function DashboardPanel({
  data,
  links,
  onOpenCategory,
  onToast,
}: {
  data: RulesData;
  links: Record<string, ClientLink[]>;
  onOpenCategory: (category: RuleCategory) => void;
  onToast: (message: string) => void;
}) {
  const [linkCategory, setLinkCategory] = useState<RuleCategory | null>(null);
  const totalRules = data.categories.reduce((sum, category) => sum + category.rules.filter((rule) => rule.enabled).length, 0);

  return (
    <div className="page-stack">
      <header className="hero-panel">
        <span className="eyebrow">简单维护，多端可用</span>
        <h1>只管添加域名，规则文件自动生成。</h1>
        <p>不用手写 YAML，也不用记规则语法。选择分类，输入域名，复制对应软件的链接即可。</p>
      </header>
      <div className="metric-grid">
        <section className="soft-card">
          <span>规则分类</span>
          <strong>{data.categories.length}</strong>
        </section>
        <section className="soft-card">
          <span>域名数量</span>
          <strong>{totalRules}</strong>
        </section>
      </div>
      <section className="section-head">
        <h2>常用分类</h2>
        <p>点击管理即可新增或删除域名。</p>
      </section>
      <div className="category-grid">
        {data.categories.map((category) => (
          <article className="category-card" key={category.id}>
            <span className="category-icon">{category.icon ?? category.name.slice(0, 2)}</span>
            <h3>{category.name}</h3>
            <p>{category.description || '维护这一类服务的域名。'}</p>
            <div className="card-meta">
              <span>{category.rules.length} 个域名</span>
              <span>{new Date(category.updatedAt).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="card-actions">
              <button onClick={() => setLinkCategory(category)}>复制链接</button>
              <button className="primary-action" onClick={() => onOpenCategory(category)}>管理</button>
            </div>
          </article>
        ))}
      </div>
      {linkCategory && <LinkSheet links={links[linkCategory.id] ?? []} onClose={() => setLinkCategory(null)} onToast={onToast} />}
    </div>
  );
}
