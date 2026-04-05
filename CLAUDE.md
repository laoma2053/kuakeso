# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

夸克搜是一个基于 Next.js 14 的夸克网盘资源搜索平台，核心功能是搜索、转存、分享网盘资源，并通过 Worker 自动清理过期资源。

技术栈：Next.js 14 (App Router) + Prisma + PostgreSQL + Redis + BullMQ

## 常用命令

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器（端口3000）
npm run dev

# 代码检查
npm run lint

# 数据库操作
npm run db:generate    # 生成 Prisma Client
npm run db:push        # 推送 schema 到数据库（开发环境）
npm run db:migrate     # 创建迁移（生产环境）

# 后台任务
npm run worker         # 启动清理 Worker
npm run db:reset-daily # 重置每日计数
npm run db:seed        # 初始化种子数据
```

### 生产部署

```bash
# 构建
npm run build

# 启动生产服务器
npm start

# Docker 部署
docker compose up -d --build

# 初始化数据库（Docker 环境）
docker compose exec web npx prisma db push
```

## 核心架构

### 1. 三层服务架构

**搜索层** (`src/lib/search-service.ts`)
- 多级缓存：Redis 缓存 + 请求合并
- IP 限流：每分钟最多 10 次
- 调用 PanSou API 获取搜索结果

**转存层** (`src/lib/save-service.ts`)
- 去重机制：通过 Redis 缓存避免重复转存
- 多账号轮询：按 `dailySaveCount` 升序选择负载最小的账号
- 账号锁：Redis 分布式锁防止并发使用同一账号
- 流程：转存到网盘 → 创建分享链接 → 记录到数据库

**清理层** (`src/worker/cleanup.ts`)
- BullMQ 定时任务，每 15 分钟执行一次
- 查询 `expiresAt < now` 的资源
- 按账号分组批量删除文件 + 清空回收站
- 更新数据库状态为 `deleted`

### 2. 夸克网盘 API 封装

`src/lib/quark-api.ts` 封装了所有夸克网盘操作：

- `getAccountInfo()` - 获取账号信息
- `parseShareUrl()` - 解析分享链接获取 pwd_id
- `getShareToken()` - 获取分享 token
- `getShareDetail()` - 获取分享详情
- `saveToNetdisk()` - 转存文件到网盘
- `createShare()` - 创建分享链接
- `deleteFiles()` - 删除文件
- `emptyRecycle()` - 清空回收站

**重要**：所有 API 调用都需要 Cookie 认证，Cookie 存储在 `CloudAccount` 表中。

### 3. 数据库模型关系

**CloudAccount** (网盘账号)
- 存储夸克账号的 Cookie
- `dailySaveCount` 用于负载均衡
- `status` 字段：`active` / `banned` / `expired`

**Resource** (资源记录)
- 关联 `CloudAccount` (外键 `accountId`)
- `fileFid` 存储转存后的文件 ID（逗号分隔）
- `expiresAt` 用于 Worker 清理判断
- `slug` 用于 SEO 友好的 URL

**CleanupTask** (清理任务记录)
- 记录每次清理的执行结果
- 关联 `CloudAccount`

**SiteConfig** (网站配置)
- KV 结构存储网站全局配置（广告、友链等）
- `key` 唯一标识，`value` 存储 JSON 内容

**SearchLog** (搜索日志)
- 记录用户搜索关键词，用于分析热门搜索

### 4. 缓存策略

**搜索缓存** (`search:{keyword}`)
- TTL: 10 分钟
- 避免频繁调用 PanSou API

**转存缓存** (`saved:{originalUrl}`)
- TTL: 30 分钟
- 避免重复转存同一资源

**账号锁** (`account_lock:{accountId}`)
- TTL: 60 秒
- 防止并发使用同一账号

**限流** (`ratelimit:search:{ip}`)
- 窗口: 60 秒
- 限制: 10 次/分钟

### 5. 环境变量依赖

必需配置：
- `DATABASE_URL` - PostgreSQL 连接字符串
- `REDIS_URL` - Redis 连接字符串
- `PANSOU_API_URL` - PanSou 搜索 API 地址
- `ADMIN_TOKEN` - 管理后台访问令牌
- `SAVE_DIR` - 网盘转存目录（默认 `/来自搜索站`）
- `SHARE_EXPIRE_MINUTES` - 资源过期时间（默认 15 分钟）

### 6. API 路由结构

```
/api/search       - 搜索资源（需验证码）
/api/save         - 转存资源（需验证码）
/api/captcha      - 生成验证码
/api/health       - 健康检查
/api/platforms    - 平台列表
/api/related      - 相关资源推荐
/api/ads          - 广告数据
/api/dialog-ads   - 弹窗广告数据
/api/links-data   - 友链数据
/api/admin/accounts    - 账号管理（需 ADMIN_TOKEN）
/api/admin/stats       - 数据统计（需 ADMIN_TOKEN）
/api/admin/ads         - 广告管理（需 ADMIN_TOKEN）
/api/admin/dialog-ads  - 弹窗广告管理（需 ADMIN_TOKEN）
/api/admin/links       - 友链管理（需 ADMIN_TOKEN）
```

### 7. 关键业务逻辑

**转存流程**：
1. 检查缓存是否已转存
2. 获取可用账号（最小负载 + 分布式锁）
3. 解析分享链接 → 获取 token → 获取文件列表
4. 转存到指定目录 → 创建新分享链接
5. 记录到数据库（设置 `expiresAt`）
6. 释放账号锁

**清理流程**：
1. 查询过期资源（`expiresAt < now`）
2. 按 `accountId` 分组
3. 批量删除文件 → 清空回收站
4. 更新资源状态为 `deleted`
5. 清除 Redis 缓存

## 开发注意事项

1. **修改 Prisma Schema 后必须执行**：
   ```bash
   npm run db:generate
   npm run db:push  # 或 db:migrate
   ```

2. **账号管理**：
   - 新增账号需要完整的夸克网盘 Cookie
   - Cookie 失效会导致转存失败，需在管理后台更新

3. **Worker 独立运行**：
   - 开发环境：`npm run worker`
   - Docker 环境：独立容器 `kuakeso-worker`

4. **PanSou API 依赖**：
   - 需要单独部署 PanSou 搜索服务
   - Docker 环境通过 `pansou-net` 网络互联

5. **Redis 必需**：
   - 用于缓存、限流、分布式锁、BullMQ 队列
   - 不可省略

6. **SEO 优化**：
   - 资源落地页：`/res/[slug]`
   - 使用 `generateMetadata` 生成动态 meta 标签
   - Sitemap：`/sitemap.xml`
   - Robots：`/robots.txt`

7. **色值规范（强制）**：
   - 所有颜色必须使用 `tailwind.config.js` 中定义的语义化 token，禁止使用 Tailwind 内置色（如 `gray-200`、`purple-600`、`blue-500` 等）
   - 常用 token 对照：

   | 用途 | Token |
   |------|-------|
   | 品牌主色（蓝） | `brand-500` / `brand-600` |
   | 强调色（紫，已转存等特殊状态） | `accent-500` / `accent-600` |
   | 页面背景 | `surface` |
   | 卡片背景 | `surface-card` |
   | 次级背景 | `surface-secondary` |
   | 悬停背景 | `surface-hover` |
   | 主要文字 | `text-primary` |
   | 次要文字 | `text-secondary` |
   | 辅助文字 | `text-tertiary` |
   | 默认边框 | `border` |

8. **三端适配规范（强制）**：
   - 每次 UI 修改必须同时适配 PC / 平板 / 移动端
   - 使用 Tailwind 响应式前缀：`sm:`（640px+）、`md:`（768px+）、`lg:`（1024px+）

9. **最小改动原则（强制）**：
   - 不修改用户未提出需求的代码
   - 若认为某处修改会更好，必须先向用户说明并征得确认，再动手
   - 功能完整性除外（保证功能正常运行所必须的改动无需确认）
