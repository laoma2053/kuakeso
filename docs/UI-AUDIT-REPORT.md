# UI 代码审计报告

## 检查范围
检查所有组件是否使用 Tailwind 配置变量，而非硬编码颜色/字体。

## 发现的问题

### 1. search-hero.tsx
**硬编码颜色：**
- `text-gray-800` → 应改为 `text-text-primary`
- `text-gray-400` → 应改为 `text-text-tertiary`
- `bg-gray-100` → 应改为 `bg-surface-secondary`
- `text-gray-700` → 应改为 `text-text-primary`
- `bg-gray-200` → 需要在 config 中定义或使用现有变量

### 2. resource-list-item.tsx
**需要检查：**
- 标题颜色逻辑
- 元信息颜色

### 3. search-sidebar.tsx
**需要检查：**
- 文字颜色
- 背景色

### 4. resource-card.tsx
**需要检查：**
- 卡片颜色

### 5. captcha-dialog.tsx
**需要检查：**
- 对话框颜色

## 修复策略

1. 创建完整的颜色映射表
2. 逐个组件替换硬编码
3. 确保所有颜色都来自 tailwind.config.js

## 下一步
需要用户确认是否立即修复所有组件。
