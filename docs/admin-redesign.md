# 管理后台重构方案

## Context

现有管理后台存在以下问题：
1. `/admin/ads` 页面空白（"添加广告"按钮被 `ads.length > 0` 条件隐藏）
2. 未登录时无登录表单
3. 所有功能堆在 `/admin/page.tsx` 一个页面，扩展性差
4. 账号管理未按网盘类型分组，未来增加百度/迅雷/UC网盘时无法扩展
5. 无友情链接后台管理
6. 无弹窗广告后台管理入口

---

## 目标架构

```
/admin                    ← 登录 + 仪表盘（统计概览）
/admin/accounts           ← 网盘账号管理（按平台分组）
/admin/ads                ← 广告管理（侧边栏广告 + 弹窗广告）
/admin/links              ← 友情链接管理
```

---

## 导航结构

顶部固定导航栏，4个模块：

| 模块 | 路径 | 图标 |
|------|------|------|
| 仪表盘 | `/admin` | LayoutDashboard |
| 账号管理 | `/admin/accounts` | Users |
| 广告管理 | `/admin/ads` | Megaphone |
| 友情链接 | `/admin/links` | Link2 |

---

## 各页面方案

### `/admin`（仪表盘）

- 登录表单（未登录时）：token 输入框 + 登录按钮
- 登录后：4张统计卡片（账号数、活跃账号、资源数、今日搜索）
- token 存 localStorage，页面加载时自动恢复登录态

### `/admin/accounts`（网盘账号管理）

**按平台分 Tab**：夸克 / 百度 / 迅雷 / UC（Tab 来自 `/api/platforms`）

每个平台 Tab 下：
- 账号列表（名称、状态、今日转存数、最后使用时间）
- 添加账号表单（名称 + Cookie）
- 删除账号

**后端**：现有 `/api/admin/accounts` 已支持，无需新增 API

### `/admin/ads`（广告管理）

两个 section，各自独立保存：

**侧边栏广告**（`sidebar_ads`）
- 调用 `/api/admin/ads`
- 每条：文字 + 链接（链接可选）
- 最多 5 条

**弹窗广告**（`dialog_ads`）
- 调用 `/api/admin/dialog-ads`
- 每条：文字 + 链接（链接可选）
- 最多 3 条，底部说明"显示在资源获取弹窗底部"

**修复**：添加按钮移到列表外，始终可见

### `/admin/links`（友情链接管理）

**新增后端 API**：
- `GET /api/admin/links` — 读取 `siteConfig` key `friendly_links`
- `POST /api/admin/links` — 保存
- `GET /api/links-data` — 公开读取（前端用）

**数据结构**：
```ts
Array<{ name: string; description: string; url: string }>
```

每条：网站名 + 网站描述 + 网址，支持增删改

---

## 共用登录态方案

所有子页面共用同一套登录逻辑：
- localStorage key: `admin_token`
- 每个页面 mount 时读取 token，验证失败跳转 `/admin`
- 抽取 `useAdminAuth` hook 复用

---

## 需要新建的文件

| 文件 | 说明 |
|------|------|
| `src/app/admin/accounts/page.tsx` | 账号管理页（从 admin/page.tsx 拆出） |
| `src/app/admin/links/page.tsx` | 友情链接管理页（新建） |
| `src/app/api/admin/links/route.ts` | 友情链接管理 API（新建） |
| `src/app/api/links-data/route.ts` | 友情链接公开读取 API（新建） |
| `src/hooks/useAdminAuth.ts` | 登录态 hook（新建，复用） |

## 需要修改的文件

| 文件 | 改动 |
|------|------|
| `src/app/admin/page.tsx` | 保留登录+仪表盘，移除账号管理逻辑 |
| `src/app/admin/ads/page.tsx` | 修复空白 + 增加弹窗广告区域 + 登录表单 |
| `src/components/resource-list-item.tsx` | 点击标题始终打开弹窗 |

---

## 验证方式

1. `/admin` 未登录 → 显示登录表单；登录后 → 显示统计卡片
2. `/admin/accounts` → 按平台 Tab 展示账号，可添加/删除
3. `/admin/ads` → 侧边栏广告和弹窗广告各自可配置，初始空列表时"添加"按钮可见
4. `/admin/links` → 可添加/编辑/删除友情链接
5. 前端 `/links` 页面从 `/api/links-data` 读取并展示
