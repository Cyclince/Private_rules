import { useMemo, useState } from 'react';
import type { DomainRuleType, ImportPreview, RuleCategory } from '../../types/domain-rules';
import { FRIENDLY_RULE_TYPES, getFriendlyRuleDescription, getFriendlyRuleType } from '../../lib/rule-types';
import type { useDomainAdmin } from '../hooks/use-domain-admin';
import { copyText } from '../lib/clipboard';

const ADVANCED_TYPES = FRIENDLY_RULE_TYPES;

export function RulesPanel({
  api,
  categories,
  category,
  onSelectCategory,
  onToast,
}: {
  api: ReturnType<typeof useDomainAdmin>;
  categories: RuleCategory[];
  category: RuleCategory;
  onSelectCategory: (id: string) => void;
  onToast: (message: string) => void;
}) {
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<DomainRuleType | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [query, setQuery] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const filteredRules = useMemo(
    () =>
      category.rules.filter((rule) =>
        `${rule.value} ${rule.note ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [category.rules, query],
  );

  async function add() {
    await api.addRule(category.id, { value, type: type || undefined, note });
    setValue('');
    setNote('');
    onToast('域名已添加');
  }

  async function previewImport() {
    const result = await api.importPreview(category.id, bulkText);
    setPreview(result.preview);
  }

  async function confirmImport() {
    await api.confirmImport(category.id, bulkText);
    setBulkText('');
    setPreview(null);
    onToast('批量导入完成');
  }

  async function createCategory() {
    const name = window.prompt('分类名称，例如 YouTube');
    if (!name?.trim()) return;
    const description = window.prompt('分类描述，可留空') ?? '';
    await api.createCategory({ name, description });
    onToast('分类已创建');
  }

  async function editCategory() {
    const name = window.prompt('新的分类名称', category.name);
    if (!name?.trim()) return;
    const note = window.prompt('分类备注，会输出为规则文件注释，可留空', category.note ?? '') ?? category.note;
    await api.updateCategory(category.id, { name, note });
    onToast('分类已更新');
  }

  async function removeCategory() {
    if (!window.confirm(`删除 ${category.name} 分类？`)) return;
    await api.deleteCategory(category.id);
    onToast('分类已删除');
  }

  async function moveCategory(direction: -1 | 1) {
    if (!api.data) return;
    const index = categories.findIndex((item) => item.id === category.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= categories.length) return;
    const nextCategories = [...categories];
    [nextCategories[index], nextCategories[nextIndex]] = [nextCategories[nextIndex], nextCategories[index]];
    await api.importData(JSON.stringify({ ...api.data, categories: nextCategories }));
    onToast('分类顺序已更新');
  }

  return (
    <div className="page-stack">
      <header className="section-head">
        <h1>{category.name}</h1>
        <p>{category.description || '维护这个分类下的域名。'}</p>
      </header>
      <section className="category-strip">
        {categories.map((item) => (
          <button className={item.id === category.id ? 'active' : ''} key={item.id} onClick={() => onSelectCategory(item.id)}>
            {item.name}
          </button>
        ))}
        <button onClick={createCategory}>新建分类</button>
        <button onClick={editCategory}>修改</button>
        <button onClick={() => moveCategory(-1)}>前移</button>
        <button onClick={() => moveCategory(1)}>后移</button>
        <button className="danger-action" onClick={removeCategory}>删除分类</button>
      </section>
      <section className="soft-card input-panel">
        <label>
          <span>新增地址规则</span>
          <input
            className="app-input"
            placeholder="例如：openai.com、emos、192.168.1.1、127.0.0.0/8、+.emos.best"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <p className="helper-text">你只需要输入域名、关键词或 IP，系统会自动识别格式。</p>
        <label>
          <span>备注，可不填</span>
          <input className="app-input" placeholder="例如：ChatGPT 官网" value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <button className="ghost-action" onClick={() => setShowAdvanced((current) => !current)}>更多设置</button>
        {showAdvanced && (
          <select className="app-input" value={type} onChange={(event) => setType(event.target.value as DomainRuleType)}>
            {ADVANCED_TYPES.map((item) => (
              <option key={item.label} value={item.type}>{item.label} - {item.description}</option>
            ))}
          </select>
        )}
        <button className="primary-action" disabled={!value.trim()} onClick={add}>添加</button>
      </section>
      <section className="soft-card">
        <div className="section-inline">
          <div>
            <h2>域名列表</h2>
            <p>{category.rules.length} 条，关闭后不会出现在订阅文件里。可搜索、排序、导出。</p>
          </div>
          <input className="app-input compact" placeholder="搜索" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="card-actions">
          <button onClick={async () => {
            try {
              await copyText(category.rules.map((rule) => rule.value).sort().join('\n'));
              onToast('已复制导出内容');
            } catch (error) {
              onToast(error instanceof Error ? error.message : '复制失败，请手动复制。');
            }
          }}>
            批量导出
          </button>
          <button onClick={() => onToast('系统保存时会自动去重')}>去重</button>
          <button onClick={() => onToast('当前列表已按搜索结果显示，可复制导出后排序')}>排序</button>
        </div>
        <div className="rule-list">
          {filteredRules.map((rule) => (
            <article
              className="rule-row"
              key={rule.id}
              onContextMenu={(event) => {
                event.preventDefault();
                if (window.confirm(`删除 ${rule.value}？`)) {
                  api.deleteRule(category.id, rule.id).then(() => onToast('已删除'));
                }
              }}
            >
              <label className="switch">
                <input
                  checked={rule.enabled}
                  type="checkbox"
                  onChange={(event) => api.updateRule(category.id, { ...rule, enabled: event.target.checked })}
                />
                <span />
              </label>
              <div>
                <strong>{rule.value}</strong>
                <span>{getFriendlyRuleType(rule)} · {getFriendlyRuleDescription(rule)}{rule.note ? ` · ${rule.note}` : ''}</span>
              </div>
              <button className="danger-action" onClick={() => api.deleteRule(category.id, rule.id).then(() => onToast('已删除'))}>
                删除
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="soft-card input-panel">
        <h2>批量添加</h2>
        <p>一行一个，支持域名、关键词、通配域名、IP、IP 段，也兼容已有专业规则。以 # 开头的注释会保留为备注。</p>
        <textarea
          className="app-input textarea"
          placeholder={'openai.com\nchatgpt.com\nemos\n+.emos.best\n192.168.1.1\n127.0.0.0/8'}
          value={bulkText}
          onChange={(event) => setBulkText(event.target.value)}
        />
        <div className="card-actions">
          <button onClick={previewImport} disabled={!bulkText.trim()}>预览</button>
          <button className="primary-action" onClick={confirmImport} disabled={!preview?.rules.length}>确认导入</button>
        </div>
        {preview && (
          <div className="import-preview-list">
            <div className="import-preview">
              <span>将新增 {preview.rules.length} 条</span>
              <span>重复 {preview.duplicateValues.length} 条</span>
              <span>无效 {preview.invalidValues.length} 条</span>
              <span>注释 {preview.comments.length} 条</span>
            </div>
            {preview.rules.slice(0, 8).map((rule) => (
              <div className="preview-row" key={rule.id}>
                <span>{rule.value}</span>
                <strong>{getFriendlyRuleType(rule)}</strong>
                <em>可添加</em>
              </div>
            ))}
          </div>
        )}
      </section>
      <button className="fab" onClick={() => document.querySelector<HTMLInputElement>('.input-panel .app-input')?.focus()}>
        +
      </button>
    </div>
  );
}
