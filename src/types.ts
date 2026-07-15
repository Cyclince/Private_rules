import type { ClientLink, RulesData } from './types/domain-rules';

export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_PASSWORD?: string;
  RULE_TOKEN?: string;
  SESSION_SECRET?: string;
};

export type AppVariables = {
  sessionId?: string;
  authType?: 'session' | 'apiKey';
};

export type ApiOk<T> = {
  ok: true;
  data: T;
};

export type CategoriesPayload = {
  data: RulesData;
  links: Record<string, ClientLink[]>;
};
