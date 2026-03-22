# 夸克网盘资源搜索平台 — 产品需求文档 (PRD)

> 版本: v1.0  
> 日期: 2026-03-08  
> 状态: 开发中

---

## 一、产品定位

**一句话描述：** 专精夸克网盘的资源搜索引擎，用户搜索→平台转存→公开分享链接，通过网盘拉新与会员返佣变现。

**核心价值链：**
```
用户搜索 → 第三方PanSou API返回资源 → 有效性检测(过滤无效) → 展示结果
    → 用户点击获取 → 验证码校验 → 平台转存到自己的夸克网盘 → 生成公开分享链接 → 返回给用户
    → 同时生成SEO落地页 → 定期清理网盘文件(15分钟)
```

**盈利模式：**
- 网盘拉新转存收益
- 网盘会员充值返佣

---

## 二、功能需求清单（MoSCoW优先级）

### P0 — Must Have（MVP核心）

| 模块 | 功能 | 说明 |
|------|------|------|
| **搜索** | 关键词搜索 | 对接PanSou API，过滤仅返回夸克网盘(`cloud_types: ["quark"]`)资源 |
| **搜索** | 资源有效性检测 | API返回结果时异步并行轻量检测(get_stoken验证)，过滤失效/被删除/无权限的链接 |
| **搜索** | 搜索结果缓存 | Redis多级缓存，热门搜索结果缓存5-15分钟，降低API调用频次 |
| **搜索** | 搜索结果排序 | 按资源更新日期(`datetime`)倒序排序，更新越近排越前 |
| **搜索** | 请求合并 | 相同关键词的并发请求只触发一次API调用，其他请求等待同一结果 |
| **转存(夸克)** | 点击转存+验证码 | 用户点击"获取资源"→弹出验证码→验证通过后后台转存 |
| **转存(夸克)** | 公开分享 | 转存完成后自动生成**公开**分享链接(无提取码) |
| **转存(夸克)** | 去重机制 | 同一资源已转存过则直接返回已有分享链接，避免重复转存 |
| **转存(夸克)** | 多账号轮询 | 支持配置多个夸克网盘账号，轮询/负载均衡分配转存任务 |
| **落地页** | 资源详情页 | 每个被获取的资源生成独立URL(`/res/[slug]`)，包含标题/描述/结构化数据 |
| **后台** | 网盘账号管理 | 配置夸克网盘Cookie，支持多账号，显示账号状态/容量/昵称 |
| **后台** | 定期清理 | 每15分钟清理一次夸克网盘中的转存文件，释放空间 |
| **后台** | 站点配置 | 主题颜色、站点名称、SEO元信息、PanSou API地址等 |
| **后台** | 账号健康检查 | 定时检查Cookie是否有效、账号是否被处罚(无法保存/无法分享) |
| **前端** | 响应式UI | PC/手机/平板自适应，2025年现代化极简设计风格 |
| **前端** | 主题色 | 采用夸克网盘Logo色系(蓝紫渐变 #5B6CF9 → #8B5CF6) |
| **合规** | 免责声明 | 页面底部"如有侵权请联系删除"声明及举报入口 |

### P1 — Should Have（第二阶段）

| 模块 | 功能 | 说明 |
|------|------|------|
| **搜索** | 热门搜索/搜索建议 | 基于搜索日志统计热词，输入联想 |
| **搜索** | 分类筛选 | 按资源类型筛选 |
| **后台** | 数据统计 | 搜索量、转存量、热门资源、UV/PV 仪表盘 |
| **SEO** | Sitemap自动生成 | 落地页自动加入sitemap，增量更新 |
| **SEO** | 结构化数据(JSON-LD) | DigitalDocument / CreativeWork |
| **性能** | 搜索限流/降级 | 高并发下的保护机制 |
| **缓存** | 热门搜索词预热 | 定时预热热门搜索词的缓存 |

### P2 — Could Have（第三阶段）

| 模块 | 功能 | 说明 |
|------|------|------|
| **用户** | 搜索历史（本地） | 基于localStorage，无需注册 |
| **转存** | 转存队列可视化 | 后台查看转存任务状态 |
| **运维** | 监控告警 | API异常、网盘账号失效告警 |
| **扩展** | 百度/UC/迅雷网盘 | 待夸克稳定后视情况决定 |

---

## 三、技术架构

### 3.1 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| **前端框架** | Next.js 14+ (App Router) | SSR/SSG支持SEO、React生态、API Routes |
| **UI框架** | Tailwind CSS + Shadcn/UI | 现代极简设计、高度可定制、开发效率高 |
| **后端** | Next.js API Routes + 独立Worker | 搜索/转存API，减少架构复杂度 |
| **高并发** | Redis (ioredis) | 搜索缓存、转存去重、请求限流/合并、队列 |
| **任务队列** | BullMQ (基于Redis) | 转存任务队列、定时清理任务 |
| **数据库** | PostgreSQL | 落地页数据、配置存储、搜索日志 |
| **ORM** | Prisma | 类型安全、迁移方便 |
| **验证码** | 自建滑块/点选验证码 | 转存接口防刷 |
| **部署** | Docker + Docker Compose | 一键部署，Ubuntu 22.04 + 1Panel |

### 3.2 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                      用户 (PC/手机/平板)                   │
└──────────────────────────┬──────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Nginx     │  反向代理 + 静态资源 + SSL
                    └──────┬──────┘
                           │
              ┌────────────▼────────────────┐
              │      Next.js 应用            │
              │  ┌──────────────────────┐   │
              │  │  前端 (SSR/SSG)       │   │  搜索页面、落地页、管理后台
              │  ├──────────────────────┤   │
              │  │  API Routes          │   │  搜索API、转存API、管理API
              │  └──────────────────────┘   │
              └──┬──────┬──────┬────────────┘
                 │      │      │
        ┌────────▼┐  ┌──▼───┐  ┌▼──────────┐
        │ Redis   │  │ PgSQL│  │ BullMQ    │
        │ 缓存/限流│  │ 持久化│  │ Worker    │
        └────┬────┘  └──────┘  └──┬────────┘
             │                    │
             │         ┌──────────▼──────────┐
             │         │  后台Worker进程       │
             │         │  - 夸克转存+分享      │
             │         │  - 15分钟文件清理     │
             │         │  - 有效性检测        │
             │         │  - 缓存预热          │
             │         │  - 账号健康检查       │
             │         └──────────┬──────────┘
             │                    │
     ┌───────▼────────┐  ┌───────▼────────┐
     │ PanSou API     │  │ 夸克网盘API     │
     │ (自部署搜索API) │  │ (非官方)        │
     └────────────────┘  └────────────────┘
```

### 3.3 高并发设计

#### 搜索高并发策略
```
1. 多级缓存
   L1: 客户端缓存 (SWR, 30s stale-while-revalidate)
   L2: Redis缓存 (热门搜索结果, 5-15分钟TTL)
   L3: PanSou API (缓存未命中时调用)

2. 请求合并 (Request Coalescing)
   相同关键词的并发请求只触发一次API调用
   其他请求等待同一结果（基于Redis锁+发布订阅）

3. 限流保护
   令牌桶算法，按IP限流 (搜索: 10次/分钟)
   PanSou API调用频率控制

4. 搜索降级
   API超时/异常时返回缓存兜底数据
```

#### 转存高并发策略
```
1. 任务队列 (BullMQ)
   转存请求入队，Worker异步消费
   支持并发度控制、失败重试 (最多3次)

2. 多账号轮询
   配置多个夸克网盘账号
   轮询/最小负载分配转存任务
   单账号限流保护，避免触发风控

3. 转存去重
   Redis记录已转存资源的分享链接 (key: 原始URL → value: 分享链接)
   命中缓存直接返回，不重复转存

4. 实时反馈
   SSE通知前端转存进度与结果
```

---

## 四、数据库设计（核心表）

```sql
-- 网盘账号表
CREATE TABLE cloud_accounts (
  id            SERIAL PRIMARY KEY,
  platform      VARCHAR(20) DEFAULT 'quark',       -- 网盘平台
  nickname      VARCHAR(100),                       -- 账号昵称
  cookie        TEXT NOT NULL,                      -- Cookie(加密存储)
  status        VARCHAR(20) DEFAULT 'active',       -- active/banned/expired
  total_space   BIGINT DEFAULT 0,                   -- 总空间(bytes)
  used_space    BIGINT DEFAULT 0,                   -- 已用空间(bytes)
  daily_save_count INT DEFAULT 0,                   -- 今日转存次数
  last_check_at TIMESTAMP,                          -- 最后健康检查时间
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 资源表(已转存的资源，用于落地页和去重)
CREATE TABLE resources (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(500) NOT NULL,              -- 资源标题
  description   TEXT,                               -- 资源描述
  original_url  VARCHAR(1000) NOT NULL,             -- 原始网盘链接
  platform      VARCHAR(20) DEFAULT 'quark',        -- 来源平台
  share_url     VARCHAR(1000),                      -- 我方分享链接
  share_id      VARCHAR(100),                       -- 分享ID
  file_ids      TEXT,                               -- 转存后的文件ID列表(JSON)
  account_id    INT REFERENCES cloud_accounts(id),  -- 使用的网盘账号
  status        VARCHAR(20) DEFAULT 'active',       -- active/expired/deleted
  slug          VARCHAR(200) UNIQUE,                -- 落地页URL slug
  seo_title     VARCHAR(200),                       -- SEO标题
  seo_description VARCHAR(500),                     -- SEO描述
  file_type     VARCHAR(50),                        -- 文件类型
  file_size     BIGINT DEFAULT 0,                   -- 文件大小
  view_count    INT DEFAULT 0,                      -- 浏览次数
  save_count    INT DEFAULT 0,                      -- 获取次数
  source_date   TIMESTAMP,                          -- 原始资源更新时间
  expires_at    TIMESTAMP,                          -- 过期时间(清理用)
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 站点配置表
CREATE TABLE site_config (
  key           VARCHAR(100) PRIMARY KEY,
  value         JSONB NOT NULL,
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 搜索日志表
CREATE TABLE search_logs (
  id            SERIAL PRIMARY KEY,
  keyword       VARCHAR(500) NOT NULL,
  results_count INT DEFAULT 0,
  ip            VARCHAR(50),
  user_agent    TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 清理任务记录表
CREATE TABLE cleanup_tasks (
  id            SERIAL PRIMARY KEY,
  account_id    INT REFERENCES cloud_accounts(id),
  status        VARCHAR(20) DEFAULT 'pending',      -- pending/running/completed/failed
  files_deleted INT DEFAULT 0,
  space_freed   BIGINT DEFAULT 0,
  error_message TEXT,
  executed_at   TIMESTAMP DEFAULT NOW()
);
```

---

## 五、页面结构与路由设计

```
前端页面：
├── /                          首页（搜索框 + 热门搜索 + 最近收录）
├── /search?q=xxx&page=1       搜索结果页
├── /res/[slug]                资源落地页（SEO关键页面，SSR）
└── /about                     关于页面 + 免责声明

管理后台：
├── /admin                     仪表盘（今日搜索/转存/UV/PV）
├── /admin/accounts            网盘账号管理
├── /admin/resources           资源管理（查看/删除已转存资源）
├── /admin/cleanup             清理任务管理
├── /admin/settings            站点设置（主题色/SEO/API配置）
└── /admin/logs                搜索日志
```

---

## 六、关键流程设计

### 6.1 搜索流程

```
用户输入关键词
    │
    ▼
前端防抖(300ms) → 请求 /api/search?q=xxx
    │
    ▼
限流检查(IP维度, 10次/分钟) ──超限──→ 返回429
    │ 通过
    ▼
Redis缓存查询 ──命中──→ 直接返回
    │ 未命中
    ▼
请求合并检查 ──已有相同请求进行中──→ 等待结果
    │ 首个请求
    ▼
调用PanSou API (POST /api/search, cloud_types:["quark"])
    │
    ▼
并行有效性检测(get_stoken验证, 超时2s, Promise.allSettled)
    │
    ▼
过滤无效资源 → 按datetime倒序排序 → 写入Redis缓存(TTL 10min) → 返回结果
```

### 6.2 转存流程

```
用户点击"获取资源"
    │
    ▼
弹出验证码弹窗 → 用户完成验证
    │
    ▼
查Redis去重缓存 ──命中──→ 直接返回已有分享链接
    │ 未命中
    ▼
创建转存任务 → 入BullMQ队列 → 前端显示"转存中..."
    │
    ▼ (Worker消费)
选择可用网盘账号(轮询/最小负载)
    │
    ▼
夸克API: extract_url → get_stoken → get_detail → save_file → query_task
    │
    ▼
夸克API: 创建公开分享(POST share/create, 无提取码)
    │
    ▼
写入数据库(resources表) + Redis缓存 + 生成落地页slug
    │
    ▼
SSE通知前端 → 显示分享链接 + "复制链接"按钮
```

### 6.3 定期清理流程（每15分钟）

```
Cron触发(*/15 * * * *)
    │
    ▼
查询resources表中 expires_at < now 的记录
    │
    ▼
按account_id分组，批量调用夸克API删除文件
    │
    ▼
清空回收站(recycle_remove)
    │
    ▼
更新resources表状态(deleted) → 记录cleanup_tasks
```

---

## 七、第三方API对接说明

### 7.1 PanSou搜索API（自部署）

```
接口地址: POST http://<pansou-host>:8888/api/search
请求体:
{
  "kw": "搜索关键词",
  "cloud_types": ["quark"],    // 仅搜索夸克网盘
  "res": "merge"               // 返回按网盘类型合并的结果
}

响应中关键字段(merged_by_type.quark):
- url: 夸克网盘分享链接
- password: 提取码(通常为空)
- note: 资源说明/标题
- datetime: 链接更新时间(用于排序)
- source: 数据来源
```

### 7.2 夸克网盘API（非官方，参考quark-auto-save项目）

| 操作 | API | 方法 |
|------|-----|------|
| 获取账号信息 | `https://pan.quark.cn/account/info` | GET |
| 获取分享Token | `BASE_URL/1/clouddrive/share/sharepage/token` | POST |
| 获取分享详情 | `BASE_URL/1/clouddrive/share/sharepage/detail` | GET |
| 转存文件 | `BASE_URL/1/clouddrive/share/sharepage/save` | POST |
| 查询任务状态 | `BASE_URL/1/clouddrive/task` | GET |
| 创建文件夹 | `BASE_URL/1/clouddrive/file` | POST |
| 删除文件 | `BASE_URL/1/clouddrive/file/delete` | POST |
| 列出目录 | `BASE_URL/1/clouddrive/file/sort` | GET |
| 回收站列表 | `BASE_URL/1/clouddrive/file/recycle/list` | GET |
| 清空回收站 | `BASE_URL/1/clouddrive/file/recycle/remove` | POST |
| 创建分享 | `BASE_URL/1/clouddrive/share` | POST |
| 签到领空间 | `BASE_URL_APP/1/clouddrive/capacity/growth/sign` | POST |

> BASE_URL = `https://drive-pc.quark.cn`  
> BASE_URL_APP = `https://drive-m.quark.cn`  
> 认证方式: Cookie (从浏览器获取)

---

## 八、UI设计规范

### 配色方案（夸克品牌色系）

```
主色渐变:  #5B6CF9 → #8B5CF6 (蓝紫渐变，夸克Logo色系)
主色:      #6C5CE7 (紫色)
辅助色:    #00D2D3 (青色，成功/强调)
背景:      #FAFBFF (淡蓝白)
卡片:      #FFFFFF + box-shadow: 0 1px 3px rgba(0,0,0,0.06)
文字主色:  #1A1D2E
文字副色:  #6B7294
边框:      #E8EAF6
错误:      #FF6B6B
```

### 交互设计

```
✦ 搜索框聚焦放大 + 背景模糊(backdrop-blur)
✦ 搜索结果卡片渐入动画(staggered fade-in, framer-motion)
✦ 骨架屏加载态(Skeleton)
✦ 转存按钮状态流转动画: 获取资源 → 验证中 → 转存中... → 复制链接 ✓
✦ 移动端底部搜索栏，拇指友好操作区
✦ 暗色模式支持（跟随系统 / 手动切换）
✦ 搜索结果无限滚动/分页
✦ 复制链接成功Toast提示
```

### 响应式断点

```
Mobile:  < 640px   (单列，底部搜索栏)
Tablet:  640-1024px (双列网格)
Desktop: > 1024px  (三列网格，侧边栏可选)
```

---

## 九、SEO策略

| 策略 | 实现方式 |
|------|---------|
| 落地页SSR | Next.js `generateMetadata` + 动态渲染 |
| 结构化数据 | JSON-LD (DigitalDocument / CreativeWork) |
| Sitemap | 自动生成，增量更新，提交搜索引擎 |
| Meta标签 | 动态title/description/keywords |
| 内链策略 | 相关资源推荐，热门搜索词聚合 |
| robots.txt | 允许爬取落地页，禁止爬取API/后台 |
| 页面速度 | SSR首屏、图片懒加载、资源压缩 |

---

## 十、开发路线图

```
Phase 1 — MVP (2-3周)
  Week 1: 项目初始化、数据库设计、PanSou搜索API对接、前端搜索页
  Week 2: 夸克转存+分享、资源落地页、基础后台
  Week 3: 有效性检测、缓存体系、验证码、响应式适配、Docker部署

Phase 2 — 增强 (2周)
  Week 4: SEO优化、定期清理、数据统计仪表盘、账号健康检查
  Week 5: 搜索体验优化(热词/联想)、暗色模式、性能调优、缓存预热

Phase 3 — 可选扩展
  百度/UC/迅雷网盘接入（视夸克站点运行情况决定）
```

---

## 十一、风险与合规

1. **版权风险**: 页面底部显示免责声明 + 举报/DMCA入口
2. **网盘风控**: 多账号轮询分散压力，单账号限流，转存间隔随机延时
3. **API稳定性**: 夸克非官方API可能变动，需做好异常处理和降级
4. **数据安全**: Cookie加密存储，后台需认证访问
5. **搜索合规**: 不主动推荐敏感内容，搜索结果取决于PanSou API返回
```
---

## 十二、参考开源项目

```
1. **PanCheck**: https://github.com/Lampon/PanCheck
2. **quark-auto-save**: https://github.com/Cp0204/quark-auto-save
3. **quark-save**: https://github.com/henggedaren/quark-save
4. **pansou**: https://github.com/fish2018/pansou
5. **搜索合规**: 不主动推荐敏感内容，搜索结果取决于PanSou API返回
