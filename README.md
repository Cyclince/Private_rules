# Private Rules

Private Rules 是一个部署在 Cloudflare Workers 上的通用代理规则订阅管理工具。通过后台维护分类和规则，系统会自动生成适用于 Mihomo、Sing-Box、Loon、Quantumult X、Surge、Shadowrocket 等客户端的分流规则文件。

## 架构

- **Cloudflare Workers + Hono**：处理后台 API、认证、订阅文件和静态资源回退。
- **Cloudflare D1**：保存分类、规则、设置和登录会话。
- **Vite + React**：构建单页管理后台，由 Workers 的 Assets binding 提供静态资源。

## 使用

1. 访问 `/admin/login`，使用服务端设置的 `ADMIN_PASSWORD` 登录。
2. 创建分类，例如 `AI`、`Emby`、`GitHub`。
3. 添加域名、关键词、通配域名、IP 或 CIDR；批量导入时一行一条，`#` 开头的行会成为后续规则的备注。
4. 在“链接”页选择分类和客户端，复制相应的订阅地址。

常用订阅地址：

```text
/rules/AI.yaml                 # 公开链接（需启用）
/sub/<RULE_TOKEN>/AI.yaml      # Token 链接
/sub/<RULE_TOKEN>/AI-qx.list   # Quantumult X
/sub/<RULE_TOKEN>/AI.json      # JSON
```

## 部署

安装依赖：

```bash
pnpm install
```

创建 D1 数据库，并将返回的 `database_id` 写入 `wrangler.toml`：

```bash
wrangler d1 create private-rules-db
```

初始化本地或远程数据库：

```bash
wrangler d1 migrations apply private-rules-db --local
wrangler d1 execute private-rules-db --local --file seed.sql

wrangler d1 migrations apply private-rules-db --remote
wrangler d1 execute private-rules-db --remote --file seed.sql
```

设置密钥：

```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put SESSION_SECRET
wrangler secret put RULE_TOKEN
```

`ADMIN_PASSWORD` 和 `SESSION_SECRET` 是登录后台的必需配置；未设置时登录会被拒绝。`RULE_TOKEN` 仅在启用 Token 链接时必需。

开发、构建与部署：

```bash
pnpm dev
pnpm build
wrangler deploy
```

## 安全说明

所有后台规则读写操作均要求在已登录的情况下，Token 链接用于隐藏路径而非加密；任何取得完整规则分流链接的人都能读取对应规则，请不要把 Token泄漏到任何地方。

## 目录

- `src/worker.ts`：Worker 路由和订阅输出入口。
- `src/lib/`：D1 数据访问、认证、解析和格式化。
- `src/frontend/`：React 管理后台、样式和浏览器端状态。
- `migrations/` 与 `seed.sql`：D1 数据库结构和示例数据。
