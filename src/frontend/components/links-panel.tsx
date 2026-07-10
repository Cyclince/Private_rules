import { useState } from 'react';
import type { ClientLink, RulesData } from '../../types/domain-rules';
import { LinkSheet } from './link-sheet';

export function LinksPanel({
  data,
  links,
  onToast,
}: {
  data: RulesData;
  links: Record<string, ClientLink[]>;
  onToast: (message: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedLinks = selectedId ? links[selectedId] ?? [] : [];

  return (
    <div className="page-stack">
      <header className="section-head">
        <h1>订阅链接</h1>
        <p>选择分类，再选择你的代理软件。推荐复制 Token 链接。</p>
      </header>
      <div className="category-grid">
        {data.categories.map((category) => (
          <article className="category-card" key={category.id}>
            <span className="category-icon">{category.icon ?? category.name.slice(0, 2)}</span>
            <h3>{category.name}</h3>
            <p>{category.rules.length} 个域名会自动生成多端规则文件。</p>
            <button className="primary-action" onClick={() => setSelectedId(category.id)}>复制链接</button>
          </article>
        ))}
      </div>
      {selectedId && <LinkSheet links={selectedLinks} onClose={() => setSelectedId(null)} onToast={onToast} />}
    </div>
  );
}
