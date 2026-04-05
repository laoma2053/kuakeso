# 资源获取弹窗交互重设计

## Context

当前问题：点击资源标题 → 验证码弹窗 → 验证通过后弹窗**关闭** → 卡片显示"获取中" → 成功后需再次点击才能看到链接。用户对新链接感知弱，体验割裂。

目标：将安全验证 + 资源获取 + 结果展示合并在**一个弹窗**内完成，PC端引导扫码，移动端直接提供链接。

---

## 用户确认的决策

| 问题 | 决策 |
|------|------|
| PC端成功界面 | 仅显示二维码 + 扫码引导，隐藏链接和保存按钮 |
| 弹窗广告配置 | 新建独立配置（`dialog_ads`），与侧边栏广告分开 |
| 获取失败处理 | 弹窗内显示错误 → 2秒后关闭弹窗 → 从卡片列表删除该资源 |

---

## 问题根因

`resource-list-item.tsx::handleCaptchaSuccess` 第一行是 `setShowCaptcha(false)`，验证通过后立即关闭弹窗，然后在卡片上异步获取资源。

---

## 修改方案

### 1. 新增 API：弹窗广告独立配置

- 公开读取：`/api/dialog-ads`（GET，无需鉴权），key 为 `dialog_ads`
- 管理配置：`/api/admin/dialog-ads`（GET/POST，需 ADMIN_TOKEN）
- 数据结构：`Array<{ text: string; url?: string }>`，最多 3 条

### 2. resource-list-item.tsx

- 删除 `handleCaptchaSuccess` 中的 `setShowCaptcha(false)`（不再关闭弹窗）
- 新增 `saving` state，调用 `/api/save` 期间为 true
- 将 `saving` 和 `saveError` 作为 prop 传给 `CaptchaDialog`
- 删除卡片上的内联 loading/error 展示
- 获取失败且 `data.invalid` 时：2秒后调用 `onInvalid` 删除卡片

### 3. captcha-dialog.tsx

**Props 新增**：
```ts
saving?: boolean
saveError?: string | null
```

**状态机**：
```
!verified                         → 验证码输入
verified && saving                → loading spinner
verified && saveError             → 错误提示 → 2秒后 onClose()
verified && shareUrl && PC端      → PC成功界面
verified && shareUrl && 移动端    → 移动端成功界面
```

**PC端成功界面**（≥768px）：
- 标题：`请使用 夸克APP 扫码获取`（"夸克APP" 用 brand-500）
- 副标题：`打开夸克APP - 点击搜索框中的相机 - 点击扫码`
- 居中大二维码（200×200）
- 资源标题（居中，text-text-secondary）
- 不显示链接和保存按钮

**移动端成功界面**（<768px）：
- 资源标题（font-semibold）
- `网盘资源链接` 标签
- 链接文字（brand-500，可点击）
- `保存到网盘` 大按钮

**广告区域**：
- 组件内 `useEffect` 调用 `/api/dialog-ads`
- 最多 3 条，有 url 则渲染为链接，否则纯文字
- 无数据时隐藏整个广告区域

---

## 关键文件

| 文件 | 改动类型 |
|------|---------|
| `src/components/captcha-dialog.tsx` | 主要重构 |
| `src/components/resource-list-item.tsx` | 流程控制调整 |
| `src/app/api/dialog-ads/route.ts` | 新建 |
| `src/app/api/admin/dialog-ads/route.ts` | 新建 |

---

## 验证方式

1. 点击资源标题 → 弹窗显示验证码
2. 验证通过 → 弹窗内切换为 loading，不关闭
3. 成功后：PC显示二维码+引导；移动端显示链接+保存按钮
4. 失败：弹窗内显示错误 → 2秒后关闭 → 卡片从列表消失
5. 广告：管理后台配置 `dialog_ads` 后，弹窗底部最多显示3条
