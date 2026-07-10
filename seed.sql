INSERT OR IGNORE INTO settings (key, value) VALUES
  ('baseUrl', ''),
  ('policyName', ''),
  ('publicLinksEnabled', 'true'),
  ('tokenLinksEnabled', 'true');

INSERT OR IGNORE INTO categories (id, name, slug, icon, description, note, sort_order, enabled, created_at, updated_at) VALUES
  ('ai', 'AI', 'AI', 'AI', 'OpenAI、Claude、Gemini 等 AI 服务。', 'AI 服务', 1, 1, datetime('now'), datetime('now')),
  ('emby', 'Emby', 'Emby', 'EM', 'Emby、Plex 等媒体服务。', '媒体服务', 2, 1, datetime('now'), datetime('now')),
  ('apple', 'Apple', 'Apple', 'AP', 'Apple 相关服务。', '', 3, 1, datetime('now'), datetime('now')),
  ('google', 'Google', 'Google', 'GO', 'Google 相关服务。', '', 4, 1, datetime('now'), datetime('now')),
  ('telegram', 'Telegram', 'Telegram', 'TG', 'Telegram 相关服务。', '', 5, 1, datetime('now'), datetime('now')),
  ('youtube', 'YouTube', 'YouTube', 'YT', 'YouTube 相关服务。', '', 6, 1, datetime('now'), datetime('now')),
  ('github', 'GitHub', 'GitHub', 'GH', 'GitHub 相关服务。', '', 7, 1, datetime('now'), datetime('now')),
  ('cloudflare', 'Cloudflare', 'Cloudflare', 'CF', 'Cloudflare 相关服务。', '', 8, 1, datetime('now'), datetime('now')),
  ('custom', 'Custom', 'Custom', 'CU', '自定义规则。', '', 9, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO rules (id, category_id, value, type, display_type, note, enabled, sort_order, created_at, updated_at) VALUES
  ('ai-openai-com', 'ai', 'openai.com', 'DOMAIN-SUFFIX', '域名后缀', '', 1, 1, datetime('now'), datetime('now')),
  ('ai-chatgpt-com', 'ai', 'chatgpt.com', 'DOMAIN-SUFFIX', '域名后缀', '', 1, 2, datetime('now'), datetime('now')),
  ('ai-anthropic-com', 'ai', 'anthropic.com', 'DOMAIN-SUFFIX', '域名后缀', '', 1, 3, datetime('now'), datetime('now')),
  ('ai-claude-ai', 'ai', 'claude.ai', 'DOMAIN-SUFFIX', '域名后缀', '', 1, 4, datetime('now'), datetime('now')),
  ('ai-gemini-google-com', 'ai', 'gemini.google.com', 'DOMAIN-SUFFIX', '域名后缀', '', 1, 5, datetime('now'), datetime('now')),
  ('emby-emos-best', 'emby', 'emos.best', 'DOMAIN-SUFFIX', '通配域名', 'Emos', 1, 1, datetime('now'), datetime('now')),
  ('emby-emos', 'emby', 'emos', 'DOMAIN-KEYWORD', '关键词', '', 1, 2, datetime('now'), datetime('now')),
  ('custom-localhost', 'custom', '127.0.0.0/8', 'IP-CIDR', 'IP 段', '', 1, 1, datetime('now'), datetime('now'));
