# 多网盘扩展开发规划

## 目标

在现有夸克网盘基础上，扩展支持 **UC网盘、百度网盘、迅雷网盘** 的搜索、转存、分享功能。

参考实现来源：https://github.com/675061370/xinyue-search/tree/main/extend/netdisk/pan

---

## 三种网盘技术特征

| 特征 | 夸克（已有） | UC | 百度 | 迅雷 |
|------|------------|-----|------|------|
| 认证方式 | Cookie | Cookie | Cookie + bdstoken | OAuth2 refresh_token |
| API base URL | `https://drive-h.quark.cn` | `https://pc-api.uc.cn` | `https://pan.baidu.com` | `https://api-pan.xunlei.com` |
| 请求参数标识 | `pr=ucpro&fr=pc` | `pr=UCBrowser&fr=pc` | 独立参数体系 | 独立参数体系 |
| 转存目录参数 | folder fid | folder fid | 路径字符串 | folder id |
| 分享密码 | 无 | 无 | 有（4位，如 `6666`） | 有（pass_code） |
| 分享链接格式 | `https://pan.quark.cn/s/xxx` | `https://drive.uc.cn/s/xxx` | `https://pan.baidu.com/s/xxx?pwd=xxxx` | `https://pan.xunlei.com/s/xxx?pwd=xxxx` |
| 实现复杂度 | 基准 | 低（复用夸克逻辑） | 中 | 高（token刷新机制） |

---

## 目标架构

```
src/lib/netdisk/
├── base.ts           ← 统一接口定义（NetdiskAPI）
├── quark-api.ts      ← 夸克（从 src/lib/quark-api.ts 迁移）
├── uc-api.ts         ← UC（复用夸克逻辑，换 base URL + pr 参数）
├── baidu-api.ts      ← 百度（独立实现）
├── xunlei-api.ts     ← 迅雷（OAuth2 + captcha_token）
└── factory.ts        ← 工厂函数，根据 platform 返回对应实例
```

`save-service.ts` 通过 `createNetdiskAPI(platform, cookie)` 获取实例，不感知具体平台。

Worker `cleanup.ts` 同理，按平台调用对应 API 的 `deleteFiles`。

---

## 统一接口定义（base.ts）

```typescript
export interface SaveAndShareResult {
  ok: boolean;
  shareUrl?: string;
  shareId?: string;
  savedFids?: string[];  // 转存后的文件 ID（用于清理）
  shareCode?: string;    // 分享密码（百度/迅雷有）
  message?: string;
}

export interface NetdiskAPI {
  verifyAccount(): Promise<{ valid: boolean; nickname: string; message?: string }>;
  saveAndShare(shareUrl: string, saveDirId: string, isFid?: boolean): Promise<SaveAndShareResult>;
  deleteFiles(fidList: string[]): Promise<{ ok: boolean }>;
}
```

---

## 分阶段开发计划

### Phase 1 — 基础层重构（不破坏现有功能）

**目标**：建立可扩展架构，夸克功能不变。

**任务**：
1. 新建 `src/lib/netdisk/` 目录
2. 创建 `base.ts`，定义 `NetdiskAPI` 接口
3. 将 `src/lib/quark-api.ts` 复制到 `src/lib/netdisk/quark-api.ts`，实现 `NetdiskAPI` 接口
4. 创建 `factory.ts`：
   ```typescript
   export function createNetdiskAPI(platform: string, cookie: string): NetdiskAPI {
     switch (platform) {
       case 'quark': return new QuarkAPI(cookie);
       // 后续在此添加
       default: throw new Error(`不支持的平台: ${platform}`);
     }
   }
   ```
5. `save-service.ts` 改用 `createNetdiskAPI(account.platform, account.cookie)`
6. 保留 `src/lib/quark-api.ts` 原文件（向后兼容），内部 re-export 新路径

**验证**：夸克转存功能正常，无回归。

---

### Phase 2 — UC网盘

**复杂度**：低。UC API 与夸克几乎相同。

**关键差异**：
- base URL: `https://drive-h.quark.cn` → `https://pc-api.uc.cn`
- 请求参数: `pr=ucpro` → `pr=UCBrowser`
- Referer: `https://pan.quark.cn/` → `https://drive.uc.cn/`

**实现方式**：`UcAPI extends QuarkAPI`，覆盖 `BASE_URL`、`PAN_URL`、`PR_PARAM` 三个常量即可，约 20 行代码。

**账号管理**：
- 认证字段：Cookie（与夸克相同）
- 管理后台账号页 platform Tab 已支持 `uc`

**清理**：复用夸克的 `deleteFiles` 逻辑（API 相同）。

---

### Phase 3 — 百度网盘

**复杂度**：中。

**转存流程**（参考 BaiduPan.php + BaiduWork.php）：
1. 从 Cookie 提取 `bdstoken`（GET `https://pan.baidu.com/api/gettemplatevariable`）
2. 如有提取码，调用 `verifyPassCode` 获取 `randsk`，更新 Cookie 中的 `BDCLND`
3. 调用 `getTransferParams` 获取 `shareId`、`userId`、`fsIds`
4. 检查/创建目标目录（路径字符串，非 fid）
5. 调用 `transferFile` 执行转存
6. 遍历目录找到转存的文件，过滤广告文件
7. 调用 `createShare` 创建分享，固定密码 `6666`
8. 返回 `shareUrl?pwd=6666`

**关键 API 端点**：
```
GET  https://pan.baidu.com/api/gettemplatevariable  → bdstoken
POST https://pan.baidu.com/api/shorturlinfo          → 验证提取码
GET  https://pan.baidu.com/share/wxlist              → 获取分享文件列表
POST https://pan.baidu.com/share/transfer            → 转存
POST https://pan.baidu.com/share/set                 → 创建分享
```

**账号管理**：
- 认证字段：Cookie（百度网盘完整 Cookie）
- `saveDirId` 字段存路径字符串（如 `/来自搜索站`），而非 fid

**清理**：
- 删除文件：`POST https://pan.baidu.com/api/filemanager?opera=delete`
- 参数：`filelist=["/path/to/file"]`（路径数组）
- `fileFid` 字段存文件路径（逗号分隔），而非 fid

**注意**：百度网盘对转存频率限制较严，`failCount` 机制尤为重要。

---

### Phase 4 — 迅雷网盘

**复杂度**：高。需要 OAuth2 token 刷新机制。

**认证机制**：
- 账号存储：`cookie` 字段存 `refresh_token`（非 Cookie 字符串）
- `access_token`：通过 `refresh_token` 换取，TTL 约 2小时，缓存 Redis
- `captcha_token`：独立获取，TTL 约 1小时，缓存 Redis
- Redis key：`xunlei:access_token:{accountId}`、`xunlei:captcha_token:{accountId}`
- 固定参数：`clientId = 'Xqp0kJBXWhwaTpB6'`、`deviceId = '925b7631473a13716b791d7f28289cad'`

**Token 刷新流程**：
```
POST https://xluser-ssl.xunlei.com/v1/auth/token
body: { client_id, grant_type: 'refresh_token', refresh_token }
→ 返回新 access_token + 新 refresh_token
→ 新 refresh_token 写回 DB（CloudAccount.cookie 字段）
→ access_token 缓存 Redis，TTL = expires_in - 60
```

**转存流程**：
1. 获取 `access_token` + `captcha_token`（优先读 Redis 缓存）
2. `GET /drive/v1/share` → 获取分享信息（`pass_code_token`、文件列表）
3. `POST /drive/v1/share/restore` → 转存到指定目录（`parent_id`）
4. `GET /drive/v1/tasks/{restore_task_id}` → 轮询直到 `progress === 100`
5. `POST /drive/v1/share` → 创建分享，返回 `share_url + pass_code`
6. 最终链接：`share_url?pwd=pass_code`

**账号管理**：
- 管理后台添加账号时，输入框 placeholder 改为"迅雷 refresh_token"
- `saveDirId` 存 folder id（数字字符串）

**清理**：
- `POST https://api-pan.xunlei.com/drive/v1/files:batchDelete`
- body: `{ ids: [fileId1, fileId2], space: '' }`
- 需要先刷新 token

---

### Phase 5 — 联动更新

**save-service.ts**：
- 工厂分发已在 Phase 1 完成
- 百度网盘的 `fileFid` 存路径，迅雷存 file id，清理时需区分

**Worker cleanup.ts**：
- 按 `account.platform` 调用对应 API 的 `deleteFiles`
- 百度：传路径数组；迅雷：需先刷新 token

**管理后台账号页（/admin/accounts）**：
- 添加账号表单：根据当前 Tab（platform）动态调整 Cookie 输入框的 placeholder
  - 夸克/UC：`夸克/UC网盘 Cookie`
  - 百度：`百度网盘 Cookie（需包含 BDUSS、STOKEN 等）`
  - 迅雷：`迅雷网盘 refresh_token`

---

## 数据库注意事项

`CloudAccount.cookie` 字段对不同平台含义不同：

| platform | cookie 字段存储内容 |
|----------|-------------------|
| quark | 夸克网盘完整 Cookie |
| uc | UC网盘完整 Cookie |
| baidu | 百度网盘完整 Cookie |
| xunlei | 迅雷 refresh_token |

`CloudAccount.saveDirId` 字段：

| platform | saveDirId 含义 |
|----------|---------------|
| quark | 目录 fid（字符串） |
| uc | 目录 fid（字符串） |
| baidu | 目录路径（如 `/来自搜索站`） |
| xunlei | 目录 id（数字字符串） |

---

## 开发顺序建议

```
Phase 1（基础重构）→ Phase 2（UC）→ Phase 3（百度）→ Phase 4（迅雷）→ Phase 5（联动）
```

每个 Phase 完成后独立验证，不影响已有功能。

---

## 如何继续开发

告知 AI 执行某个 Phase 时，提供以下上下文：
1. 本文档路径：`docs/multi-netdisk-extension.md`
2. 参考 PHP 实现：`https://github.com/675061370/xinyue-search/tree/main/extend/netdisk/pan`
3. 当前项目架构：`CLAUDE.md`
4. 指定从哪个 Phase 开始，例如："按照 multi-netdisk-extension.md 的规划，执行 Phase 2 UC网盘开发"
