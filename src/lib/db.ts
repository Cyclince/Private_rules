import type { DomainRule, RuleCategory, RuleSettings, RulesData } from '../types/domain-rules';
import type { Env } from '../types';
import { parseRuleInput } from './parser';
import { id, slugify } from './slug';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  note: string | null;
  sort_order: number | null;
  enabled: number | null;
  created_at: string;
  updated_at: string;
};

type RuleRow = {
  id: string;
  category_id: string;
  value: string;
  type: DomainRule['type'];
  display_type: string | null;
  note: string | null;
  enabled: number | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

const defaultSettings: RuleSettings = {
  baseUrl: '',
  policyName: '',
  publicLinksEnabled: true,
  tokenLinksEnabled: true,
};

let databaseReady: Promise<void> | undefined;

/**
 * Allows a newly deployed Worker to start with an empty D1 database. The
 * statements are idempotent and the promise is reused for the lifetime of a
 * Worker isolate, so ordinary requests do not repeatedly initialise schema.
 */
export function ensureDatabase(env: Env) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
      icon TEXT, description TEXT, note TEXT, sort_order INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY, category_id TEXT NOT NULL, value TEXT NOT NULL,
      type TEXT NOT NULL, display_type TEXT, note TEXT, enabled INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )`,
    'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)',
    'CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)',
    'CREATE INDEX IF NOT EXISTS idx_rules_category_id ON rules(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)',
    'CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_rules_unique_value ON rules(category_id, type, value)',
    `INSERT OR IGNORE INTO settings (key, value) VALUES
      ('baseUrl', ''), ('policyName', ''), ('publicLinksEnabled', 'true'), ('tokenLinksEnabled', 'true')`,
  ];

  databaseReady ??= env.DB
    .batch(statements.map((statement) => env.DB.prepare(statement)))
    .then(() => undefined);
  return databaseReady;
}

export function now() {
  return new Date().toISOString();
}

function categoryFromRow(row: CategoryRow, rules: DomainRule[]): RuleCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon ?? undefined,
    description: row.description ?? undefined,
    note: row.note ?? undefined,
    enabled: row.enabled !== 0,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rules,
  };
}

function ruleFromRow(row: RuleRow): DomainRule {
  return {
    id: row.id,
    categoryId: row.category_id,
    value: row.value,
    type: row.type,
    displayType: row.display_type ?? undefined,
    note: row.note ?? undefined,
    enabled: row.enabled !== 0,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSettings(env: Env): Promise<RuleSettings> {
  const rows = await env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string | null }>();
  const settings = { ...defaultSettings };
  for (const row of rows.results ?? []) {
    if (row.key === 'baseUrl') settings.baseUrl = row.value ?? '';
    if (row.key === 'policyName') settings.policyName = row.value ?? '';
    if (row.key === 'publicLinksEnabled') settings.publicLinksEnabled = row.value !== 'false';
    if (row.key === 'tokenLinksEnabled') settings.tokenLinksEnabled = row.value !== 'false';
  }
  return settings;
}

export async function saveSettings(env: Env, input: Partial<RuleSettings>) {
  const next = { ...(await getSettings(env)), ...input };
  await env.DB.batch(
    Object.entries(next).map(([key, value]) =>
      env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, String(value)),
    ),
  );
  return next;
}

export async function getRulesData(env: Env): Promise<RulesData> {
  const [categoryRows, ruleRows, settings] = await Promise.all([
    env.DB.prepare('SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC').all<CategoryRow>(),
    env.DB.prepare('SELECT * FROM rules ORDER BY sort_order ASC, created_at ASC').all<RuleRow>(),
    getSettings(env),
  ]);

  const rulesByCategory = new Map<string, DomainRule[]>();
  for (const row of ruleRows.results ?? []) {
    const list = rulesByCategory.get(row.category_id) ?? [];
    list.push(ruleFromRow(row));
    rulesByCategory.set(row.category_id, list);
  }

  const categories = (categoryRows.results ?? []).map((row) => categoryFromRow(row, rulesByCategory.get(row.id) ?? []));
  const updatedAt = categories.reduce((latest, category) => (category.updatedAt > latest ? category.updatedAt : latest), '');

  return {
    version: 1,
    settings,
    meta: {
      d1Ready: true,
      adminPasswordConfigured: Boolean(env.ADMIN_PASSWORD),
      ruleTokenConfigured: Boolean(env.RULE_TOKEN),
      sessionSecretConfigured: Boolean(env.SESSION_SECRET),
    },
    categories,
    updatedAt: updatedAt || now(),
  };
}

export async function createCategory(env: Env, input: Partial<RuleCategory>) {
  const timestamp = now();
  const name = input.name?.trim();
  if (!name) throw new Error('请输入分类名称。');
  const categoryId = id('cat');
  const slug = input.slug?.trim() || slugify(name);
  const sortOrder = input.sortOrder ?? Date.now();

  await env.DB.prepare(
    'INSERT INTO categories (id, name, slug, icon, description, note, sort_order, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      categoryId,
      name,
      slug,
      input.icon?.trim() || name.slice(0, 2).toUpperCase(),
      input.description?.trim() || '',
      input.note?.trim() || '',
      sortOrder,
      input.enabled === false ? 0 : 1,
      timestamp,
      timestamp,
    )
    .run();
  return getRulesData(env);
}

export async function updateCategory(env: Env, categoryId: string, input: Partial<RuleCategory>) {
  const current = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(categoryId).first<CategoryRow>();
  if (!current) throw new Error('分类不存在。');
  const name = input.name?.trim() || current.name;
  const timestamp = now();
  await env.DB.prepare(
    'UPDATE categories SET name = ?, slug = ?, icon = ?, description = ?, note = ?, sort_order = ?, enabled = ?, updated_at = ? WHERE id = ?',
  )
    .bind(
      name,
      input.slug?.trim() || current.slug,
      input.icon ?? current.icon,
      input.description ?? current.description,
      input.note ?? current.note,
      input.sortOrder ?? current.sort_order ?? 0,
      input.enabled === undefined ? current.enabled ?? 1 : input.enabled ? 1 : 0,
      timestamp,
      categoryId,
    )
    .run();
  return getRulesData(env);
}

export async function deleteCategory(env: Env, categoryId: string) {
  await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(categoryId).run();
  return getRulesData(env);
}

export async function addRule(env: Env, categoryId: string, input: { value: string; type?: DomainRule['type']; note?: string }) {
  const category = await env.DB.prepare('SELECT id FROM categories WHERE id = ?').bind(categoryId).first();
  if (!category) throw new Error('分类不存在。');
  const rule = parseRuleInput(input.value, input.type, input.note);
  await insertRule(env, categoryId, rule, Date.now());
  await touchCategory(env, categoryId);
  return getRulesData(env);
}

export async function updateRule(env: Env, categoryId: string, ruleId: string, input: Partial<DomainRule>) {
  const current = await env.DB.prepare('SELECT * FROM rules WHERE id = ? AND category_id = ?').bind(ruleId, categoryId).first<RuleRow>();
  if (!current) throw new Error('规则不存在。');
  const timestamp = now();
  await env.DB.prepare(
    'UPDATE rules SET value = ?, type = ?, display_type = ?, note = ?, enabled = ?, sort_order = ?, updated_at = ? WHERE id = ? AND category_id = ?',
  )
    .bind(
      input.value ?? current.value,
      input.type ?? current.type,
      input.displayType ?? current.display_type,
      input.note ?? current.note,
      input.enabled === undefined ? current.enabled ?? 1 : input.enabled ? 1 : 0,
      input.sortOrder ?? current.sort_order ?? 0,
      timestamp,
      ruleId,
      categoryId,
    )
    .run();
  await touchCategory(env, categoryId);
  return getRulesData(env);
}

export async function deleteRule(env: Env, categoryId: string, ruleId: string) {
  await env.DB.prepare('DELETE FROM rules WHERE id = ? AND category_id = ?').bind(ruleId, categoryId).run();
  await touchCategory(env, categoryId);
  return getRulesData(env);
}

export async function insertRule(env: Env, categoryId: string, rule: DomainRule, sortOrder = 0) {
  await env.DB.prepare(
    'INSERT OR IGNORE INTO rules (id, category_id, value, type, display_type, note, enabled, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      rule.id,
      categoryId,
      rule.value,
      rule.type,
      rule.displayType ?? '',
      rule.note ?? '',
      rule.enabled ? 1 : 0,
      rule.sortOrder ?? sortOrder,
      rule.createdAt,
      rule.updatedAt,
    )
    .run();
}

export async function importRulesData(env: Env, data: RulesData) {
  const timestamp = now();
  await saveSettings(env, data.settings);
  for (const [index, category] of data.categories.entries()) {
    const categoryId = category.id || id('cat');
    await env.DB.prepare(
      'INSERT OR REPLACE INTO categories (id, name, slug, icon, description, note, sort_order, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        categoryId,
        category.name,
        category.slug || slugify(category.name),
        category.icon ?? category.name.slice(0, 2).toUpperCase(),
        category.description ?? '',
        category.note ?? '',
        category.sortOrder ?? index,
        category.enabled === false ? 0 : 1,
        category.createdAt ?? timestamp,
        category.updatedAt ?? timestamp,
      )
      .run();
    for (const [ruleIndex, rule] of category.rules.entries()) {
      await insertRule(env, categoryId, { ...rule, id: rule.id || id('rule') }, rule.sortOrder ?? ruleIndex);
    }
  }
  return getRulesData(env);
}

async function touchCategory(env: Env, categoryId: string) {
  await env.DB.prepare('UPDATE categories SET updated_at = ? WHERE id = ?').bind(now(), categoryId).run();
}
