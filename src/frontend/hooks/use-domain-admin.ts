import { useCallback, useEffect, useState } from 'react';
import type { ClientLink, DomainRule, DomainRuleType, ImportPreview, RulesData } from '../../types/domain-rules';

type LinksByCategory = Record<string, ClientLink[]>;

export function useDomainAdmin() {
  const [data, setData] = useState<RulesData | null>(null);
  const [links, setLinks] = useState<LinksByCategory>({});
  const [meta, setMeta] = useState({
    authenticated: false,
    passwordConfigured: false,
    ruleTokenConfigured: false,
    sessionSecretConfigured: false,
    d1Ready: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [response, meResponse] = await Promise.all([fetch('/api/categories'), fetch('/api/auth/me')]);
      if (response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!response.ok) throw new Error('无法加载域名数据，请检查 D1 数据库绑定。');
      const payload = (await response.json()) as { data: RulesData; links: LinksByCategory };
      setData(payload.data);
      setLinks(payload.links);
      if (meResponse.ok) {
        const me = (await meResponse.json()) as typeof meta;
        setMeta(me);
      }
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '加载失败。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (url: string, options: RequestInit) => {
      const response = await fetch(url, {
        ...options,
        headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        const message = payload.error ?? '操作失败。';
        setError(message);
        throw new Error(message);
      }
      await refresh();
      return response;
    },
    [refresh],
  );

  return {
    data,
    links,
    loading,
    error,
    clearError: () => setError(''),
    meta,
    refresh,
    createCategory: (input: { name: string; icon?: string; description?: string }) =>
      mutate('/api/categories', { method: 'POST', body: JSON.stringify(input) }),
    updateCategory: (id: string, input: Record<string, unknown>) =>
      mutate(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    updateSettings: (input: Record<string, unknown>) =>
      mutate('/api/settings', { method: 'PATCH', body: JSON.stringify(input) }),
    deleteCategory: (id: string) => mutate(`/api/categories/${id}`, { method: 'DELETE' }),
    addRule: (categoryId: string, input: { value: string; type?: DomainRuleType; note?: string }) =>
      mutate(`/api/categories/${categoryId}/rules`, { method: 'POST', body: JSON.stringify(input) }),
    updateRule: (categoryId: string, rule: DomainRule) =>
      mutate(`/api/categories/${categoryId}/rules/${rule.id}`, { method: 'PATCH', body: JSON.stringify(rule) }),
    deleteRule: (categoryId: string, ruleId: string) =>
      mutate(`/api/categories/${categoryId}/rules/${ruleId}`, { method: 'DELETE' }),
    importPreview: async (categoryId: string, text: string) => {
      const response = await fetch(`/api/categories/${categoryId}/rules/bulk-import`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, confirm: false }),
      });
      return response.json() as Promise<{ preview: ImportPreview }>;
    },
    confirmImport: (categoryId: string, text: string) =>
      mutate(`/api/categories/${categoryId}/rules/bulk-import`, {
        method: 'POST',
        body: JSON.stringify({ text, confirm: true }),
      }),
    exportData: async () => {
      const response = await fetch('/api/data');
      return JSON.stringify(await response.json(), null, 2);
    },
    importData: (json: string) => mutate('/api/data', { method: 'PUT', body: json }),
  };
}
