# 夸克搜 - 夸克网盘资源搜索平台

一个基于 Next.js 14 构建的夸克网盘资源搜索平台，支持搜索、转存、分享、自动清理。

## 技术栈

- **前端**: Next.js 14 (App Router) + React 18 + Tailwind CSS
- **后端**: Next.js API Routes + Prisma ORM + ioredis
- **数据库**: PostgreSQL 16 + Redis 7
- **任务队列**: BullMQ
- **部署**: Docker Compose

## 功能特性

- 🔍 **资源搜索** - 接入 PanSou API，实时搜索全网夸克网盘资源
- 🔗 **转存分享** - 自动转存到自有网盘并生成公开分享链接
- 🔄 **自动清理** - 每15分钟清理已过期资源，释放网盘空间，同步清除 Redis 缓存防止返回失效链接
- 🛡️ **验证码保护** - 数学验证码防刷
- 📊 **管理后台** - 账号管理（按平台分组）、广告管理、友情链接管理、数据统计
- 🌙 **暗色模式** - 自动跟随系统 / 手动切换
- 📱 **响应式** - 完美适配移动端
- 🔍 **SEO优化** - SSR + Sitemap + JSON-LD 结构化数据

### 缓存与并发架构

- **L1 搜索缓存** (`search:{platform}:{keyword}`) - TTL 10分钟，相同关键词秒回；搜索请求合并（分布式锁），并发相同关键词只调用一次 PanSou API
- **L2 资源级分布式锁** (`lock:resource:{md5}`) - TTL 2分钟，并发请求同一资源只转存一次，其余等待结果（最多30秒），超时降级
- **L3 转存缓存** (`saved:{originalUrl}`) - TTL 10分钟，已转存的分享链接毫秒级返回；Worker 清理资源时同步删除对应缓存

### 账号池调度

- 过滤：Cookie 有效 + 空间使用率 < 95%
- 排序：`failCount asc`（健康优先）→ `dailySaveCount asc`（负载均衡）
- 转存成功：`failCount` 清零；转存失败：`failCount +1`
- 账号锁（`account_lock:{id}`）防止同一账号被并发使用

### 反爬虫

夸克网盘 API 请求携带完整浏览器特征头：`User-Agent`、`Origin`、`Referer`、`sec-ch-ua`、`sec-fetch-*` 等

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API 路由
│   │   ├── search/         # 搜索 API
│   │   ├── save/           # 转存 API
│   │   ├── captcha/        # 验证码 API
│   │   ├── health/         # 健康检查
│   │   └── admin/          # 管理后台 API
│   ├── search/             # 搜索结果页
│   ├── res/[slug]/         # 资源落地页 (SEO)
│   ├── admin/              # 管理后台
│   ├── about/              # 关于页
│   └── disclaimer/         # 免责声明页
├── components/             # React 组件
│   ├── header.tsx          # 导航头部
│   ├── footer.tsx          # 页脚
│   ├── search-hero.tsx     # 首页搜索区域
│   ├── resource-card.tsx   # 资源卡片
│   ├── resource-detail.tsx # 资源详情
│   └── captcha-dialog.tsx  # 验证码弹窗
├── lib/                    # 核心库
│   ├── quark-api.ts        # 夸克网盘 API
│   ├── pansou-api.ts       # PanSou 搜索 API
│   ├── search-service.ts   # 搜索服务 (缓存+限流+合并)
│   ├── save-service.ts     # 转存服务 (去重+轮询+分享)
│   ├── captcha.ts          # 验证码服务
│   ├── prisma.ts           # 数据库客户端
│   └── redis.ts            # Redis 客户端
├── worker/                 # 后台任务
│   └── cleanup.ts          # 资源清理 Worker
└── scripts/                # 脚本
    └── reset-daily.ts      # 每日计数重置
```

## 快速开始

### 环境要求

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### 开发环境

```bash
# 1. 克隆项目
git clone <repo-url>
cd wangpanso

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入实际配置

# 4. 初始化数据库
npx prisma db push
npx prisma generate

# 5. 启动开发服务器
npm run dev
```

### Docker 部署 (推荐)

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env

# 2. 启动所有服务
docker compose up -d

# 3. 初始化数据库
docker compose exec web npx prisma db push
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | - |
| `REDIS_URL` | Redis 连接字符串 | `redis://localhost:6379` |
| `PANSOU_API_URL` | PanSou 搜索 API 地址 | `http://localhost:8888` |
| `ADMIN_TOKEN` | 管理后台访问令牌 | `changeme` |
| `SAVE_DIR` | 网盘转存目录 | `/来自搜索站` |
| `SHARE_EXPIRE_MINUTES` | 资源过期清理周期(分钟)，Worker按此周期清理 | `15` |
| `PORT` | Web 服务对外端口 | `6060` |
| `NEXT_PUBLIC_SITE_URL` | 网站公开访问地址 | `http://localhost:6060` |
| `NEXT_PUBLIC_SITE_NAME` | 网站名称 | `夸克搜` |

## 使用流程

1. 在管理后台 (`/admin`) 添加夸克网盘账号 (Cookie)
2. 确保 PanSou API 服务正常运行
3. 用户搜索 → 获取结果 → 验证码 → 转存+分享 → 返回链接
4. Worker 每15分钟自动清理过期资源

## 许可证

MIT
