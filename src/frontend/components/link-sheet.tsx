import type { ClientLink } from '../../types/domain-rules';
import { useState } from 'react';

export function LinkSheet({
  links,
  onClose,
  onToast,
}: {
  links: ClientLink[];
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const [preview, setPreview] = useState<{ title: string; content: string } | null>(null);

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    onToast('链接已复制');
    onClose();
  }

  async function showPreview(link: ClientLink) {
    const response = await fetch(link.publicUrl);
    setPreview({
      title: `${link.name} 预览`,
      content: await response.text(),
    });
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="link-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>选择你的代理软件</h2>
        <p>点击复制即可获得适合该客户端的链接。默认推荐 Token 私密链接，也可以预览生成内容。</p>
        <div className="client-grid">
          {links.map((link) => (
            <div className="client-row" key={link.id}>
              <span className="client-icon">{link.icon}</span>
              <div>
                <strong>{link.name}</strong>
                <span>{link.description}</span>
                {!link.supported && <span>即将支持，当前复制通用链接</span>}
              </div>
              <div className="client-actions">
                <button className="primary-action" onClick={() => copy(link.recommendedUrl)}>复制</button>
                <button onClick={() => showPreview(link)}>预览</button>
              </div>
            </div>
          ))}
        </div>
        {preview && (
          <div className="preview-box">
            <div className="section-inline">
              <strong>{preview.title}</strong>
              <button onClick={() => setPreview(null)}>关闭</button>
            </div>
            <pre>{preview.content.slice(0, 2000)}</pre>
          </div>
        )}
      </section>
    </div>
  );
}
