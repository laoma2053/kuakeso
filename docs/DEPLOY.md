# 夸克搜 - 部署文档

> 本文档详细说明如何在 Ubuntu 22.04 + 1Panel 环境下部署「夸克搜」夸克网盘资源搜索平台。

---

## 目录

1. [环境要求](#1-环境要求)
2. [架构概览](#2-架构概览)
3. [前置准备](#3-前置准备)
4. [快速部署（Docker Compose）](#4-快速部署docker-compose)
5. [手动部署（非 Docker）](#5-手动部署非-docker)
6. [PanSou 搜索 API 部署](#6-pansou-搜索-api-部署)
7. [Nginx 反向代理配置](#7-nginx-反向代理配置)
8. [SSL 证书配置](#8-ssl-证书配置)
9. [定时任务配置](#9-定时任务配置)
10. [管理后台使用](#10-管理后台使用)
11. [监控与日志](#11-监控与日志)
12. [更新升级](#12-更新升级)
13. [常见问题排查](#13-常见问题排查)

---

## 1. 环境要求

### 硬件要求

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU  | 1 核     | 2 核     |
| 内存 | 1 GB     | 2 GB+    |
| 硬盘 | 20 GB    | 40 GB+   |
| 带宽 | 1 Mbps   | 5 Mbps+  |

### 软件要求

- **操作系统**：Ubuntu 22.04 LTS
- **Docker**：20.10+
- **Docker Compose**：V2 (docker compose)
- **Node.js**：20.x（仅手动部署需要）
- **1Panel**：最新版（可选，提供可视化管理）

### 域名与网络

- 一个已解析到服务器 IP 的域名
- 服务器开放 80/443 端口

---

## 2. 架构概览

```
                    ┌─────────────────┐
                    │    Nginx        │
                    │  (反向代理)      │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
       ┌──────┴──────┐         ┌────────────┴───────┐
       │  Next.js    │         │  PanSou API        │
       │  Web App    │         │  (搜索接口)         │
       │  :6060      │         │  :8888             │
       └──────┬──────┘         └────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───┴───┐ ┌──┴──┐ ┌───┴────┐
│Postgres│ │Redis│ │Worker  │
│ :5432  │ │:6379│ │(清理)  │
└────────┘ └─────┘ └────────┘
```

- **Next.js Web App**：前端页面 + API 路由
- **Worker**：BullMQ 定时清理任务（15 分钟周期）
- **PostgreSQL**：持久化数据存储
- **Redis**：缓存、速率限制、任务队列
- **PanSou API**：第三方搜索接口（独立部署）

---

## 3. 前置准备

### 3.1 安装 Docker 和 Docker Compose

如果通过 1Panel 安装，Docker 已自动配置。否则手动安装：

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version
```

### 3.2 克隆项目

```bash
cd /opt
git clone https://github.com/your-username/wangpanso.git
cd wangpanso
```

### 3.3 获取夸克网盘 Cookie

1. 浏览器登录 [夸克网盘](https://pan.quark.cn/)
2. 打开开发者工具（F12） → Network 标签
3. 刷新页面，找到任意请求，复制请求头中的完整 `Cookie` 值
4. 建议准备 **2-3 个账号**，可分散转存压力

> ⚠️ **重要**：Cookie 有效期有限，过期后需在管理后台更新。建议使用不常用的账号。

---

## 4. 快速部署（Docker Compose）

这是**推荐**的部署方式。

### 4.1 配置环境变量

```bash
cd /opt/wangpanso

# 复制示例配置文件
cp .env.example .env

# 编辑配置
nano .env
```

修改以下关键配置：

```bash
# ========== 必须修改 ==========

# 数据库密码（请使用强密码）
DB_PASSWORD=your_strong_password_here

# 管理后台访问令牌（请使用强密码）
ADMIN_TOKEN=your_admin_token_here

# PanSou 搜索 API 地址（见第6节）
PANSOU_API_URL=http://pansou:8888

# 网站域名（用于 SEO 和分享链接）
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=夸克搜

# ========== 可选修改 ==========

# 资源过期清理周期（分钟），Worker按此周期扫描并删除过期资源
# 注意：夸克分享链接固定为1天过期（兜底），这里控制的是主动清理频率
SHARE_EXPIRE_MINUTES=15

# 转存目录名称
SAVE_DIR=/来自搜索站

# Web 服务对外端口（容器内固定3000，此处为宿主机映射端口）
PORT=6060
```

### 4.2 启动服务

```bash
# 构建并启动所有服务（后台运行）
docker compose up -d --build

# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 4.3 初始化数据库

数据库表会由 Prisma 在首次连接时自动通过 `prisma db push` 创建。如果需要手动初始化：

```bash
# 进入 web 容器
docker compose exec web sh

# 执行数据库迁移（锁定 Prisma 版本，避免自动升级到不兼容的新版本）
npx prisma@5.22.0 db push

# 退出容器
exit
```

### 4.4 验证部署

```bash
# 健康检查
curl http://localhost:6060/api/health

# 预期返回
# {"status":"ok","timestamp":"...","services":{"database":"ok","redis":"ok"}}
```

浏览器访问 `http://your-server-ip:6060` 应该能看到首页。

---

## 5. 手动部署（非 Docker）

适用于不使用 Docker 的场景。

### 5.1 安装 Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # 应输出 v20.x.x
```

### 5.2 安装 PostgreSQL 16

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-16

# 创建数据库和用户
sudo -u postgres psql -c "CREATE USER wangpanso WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE wangpanso OWNER wangpanso;"
```

### 5.3 安装 Redis 7

```bash
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 5.4 构建和运行

```bash
cd /opt/wangpanso

# 安装依赖
npm ci

# 生成 Prisma Client
npx prisma generate

# 推送数据库 Schema
npx prisma db push

# 构建项目
npm run build

# 启动 Web（使用 PM2 管理）
npm install -g pm2
pm2 start npm --name "wangpanso-web" -- start

# 启动 Worker
pm2 start npm --name "wangpanso-worker" -- run worker

# 保存 PM2 配置
pm2 save
pm2 startup
```

---

## 6. PanSou 搜索 API 部署

网盘搜依赖 [PanSou](https://github.com/pansou/pansou) 作为搜索数据源，需要独立部署。

### 6.1 Docker 方式部署

```bash
# 拉取并运行 PanSou
docker run -d \
  --name pansou \
  --restart unless-stopped \
  -p 8888:8888 \
  your-pansou-image:latest
```

> 具体镜像名和配置请参考 PanSou 项目文档。

### 6.2 与主项目网络互通

如果 PanSou 也通过 Docker 部署，建议加入同一网络：

```bash
# 创建共享网络
docker network create wangpanso-net

# 将服务加入网络
docker network connect wangpanso-net pansou
docker network connect wangpanso-net wangpanso-web
```

或者直接在 `docker-compose.yml` 中添加 PanSou 服务：

```yaml
services:
  pansou:
    image: your-pansou-image:latest
    container_name: pansou
    restart: unless-stopped
    ports:
      - "8888:8888"
```

然后将 `.env` 中的 `PANSOU_API_URL` 设为 `http://pansou:8888`。

### 6.3 验证 PanSou API

```bash
curl -X POST http://localhost:8888/api/search \
  -H "Content-Type: application/json" \
  -d '{"keyword":"测试"}'
```

应返回包含搜索结果的 JSON。

---

## 7. Nginx 反向代理配置

### 7.1 通过 1Panel 配置

1. 进入 1Panel → **网站** → **创建网站**
2. 选择 **反向代理**
3. 域名填写你的域名
4. 代理地址填 `http://127.0.0.1:6060`
5. 保存后在 **配置文件** 中添加以下优化项

### 7.2 手动 Nginx 配置

创建配置文件 `/etc/nginx/sites-available/wangpanso`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS（配置 SSL 后取消注释）
    # return 301 https://$server_name$request_uri;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:6060;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # API 路由 - 不缓存
    location /api/ {
        proxy_pass http://127.0.0.1:6060;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 速率限制（配合应用层的限制）
        # limit_req zone=api burst=20 nodelay;
    }

    # 主应用
    location / {
        proxy_pass http://127.0.0.1:6060;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/wangpanso /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL 证书配置

### 8.1 通过 1Panel 配置（推荐）

1. 进入 1Panel → **网站** → 选择站点 → **HTTPS**
2. 点击 **申请证书**，选择 Let's Encrypt
3. 自动完成 SSL 配置和续期

### 8.2 使用 Certbot 手动配置

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期（Certbot 默认已配置定时任务）
sudo certbot renew --dry-run
```

### 8.3 更新环境变量

证书配置后，更新 `.env`：

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

重启服务：

```bash
docker compose restart web
```

---

## 9. 定时任务配置

### 9.1 每日计数重置

清理 Worker 的定时清理任务已内置（每 15 分钟），但**每日转存计数重置**需要通过 crontab 配置：

```bash
crontab -e
```

添加以下定时任务：

```cron
# 每天凌晨 0:05 重置每日转存计数
5 0 * * * docker compose -f /opt/wangpanso/docker-compose.yml exec -T web npx tsx src/scripts/reset-daily.ts >> /var/log/wangpanso-daily-reset.log 2>&1
```

### 9.2 非 Docker 部署的定时任务

```cron
# 每天凌晨 0:05 重置每日转存计数
5 0 * * * cd /opt/wangpanso && npx tsx src/scripts/reset-daily.ts >> /var/log/wangpanso-daily-reset.log 2>&1
```

### 9.3 日志轮转（可选）

创建 `/etc/logrotate.d/wangpanso`：

```
/var/log/wangpanso-*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
}
```

---

## 10. 管理后台使用

### 10.1 访问管理后台

浏览器访问：`https://your-domain.com/admin`

使用 `.env` 中配置的 `ADMIN_TOKEN` 作为访问令牌登录。

### 10.2 添加夸克账号

1. 进入管理后台 → **账号管理**
2. 点击 **添加账号**
3. 填写：
   - **名称**：便于识别的昵称（如 "账号1"）
   - **Cookie**：从夸克网盘获取的完整 Cookie 字符串
4. 系统会自动验证 Cookie 有效性并获取账号信息

### 10.3 监控面板

管理后台首页显示：

- 今日搜索量
- 总资源数
- 活跃账号数
- 今日清理次数

### 10.4 Cookie 更新

Cookie 过期后，在管理后台的账号列表中点击编辑，更新 Cookie 即可。建议设置提醒，定期检查（一般 30 天内需要更新）。

---

## 11. 监控与日志

### 11.1 查看容器日志

```bash
# 查看所有服务日志
docker compose logs -f

# 仅查看 Web 日志
docker compose logs -f web

# 仅查看 Worker 日志
docker compose logs -f worker

# 查看最近 100 行
docker compose logs --tail=100 web
```

### 11.2 健康检查

```bash
# API 健康检查
curl https://your-domain.com/api/health

# 检查容器状态
docker compose ps

# 检查资源使用
docker stats
```

### 11.3 数据库查看

```bash
# 进入数据库
docker compose exec postgres psql -U wangpanso -d wangpanso

# 常用查询
SELECT COUNT(*) FROM resources;                      -- 资源总数
SELECT COUNT(*) FROM search_logs WHERE created_at > NOW() - INTERVAL '1 day';  -- 今日搜索量
SELECT name, daily_save_count, status FROM cloud_accounts;  -- 账号状态
SELECT * FROM cleanup_tasks ORDER BY executed_at DESC LIMIT 10;  -- 最近清理记录
```

### 11.4 Redis 监控

```bash
# 进入 Redis
docker compose exec redis redis-cli

# 常用命令
INFO memory          # 内存使用
DBSIZE               # Key 数量
KEYS search:*        # 查看搜索缓存
KEYS ratelimit:*     # 查看速率限制
KEYS saved:*         # 查看保存缓存
```

---

## 12. 更新升级

### 12.1 拉取最新代码

```bash
cd /opt/wangpanso
git pull origin main
```

### 12.2 重新构建并部署

```bash
# 重新构建镜像
docker compose build --no-cache

# 重启服务（会有短暂停机）
docker compose down
docker compose up -d

# 或滚动更新（零停机）
docker compose up -d --build web
docker compose up -d --build worker
```

### 12.3 数据库迁移

如果更新涉及数据库 Schema 变更：

```bash
docker compose exec web npx prisma@5.22.0 db push
```

### 12.4 回滚

```bash
# 回滚到上一个版本
git log --oneline -5        # 查看最近提交
git checkout <commit-hash>  # 回退到指定版本

# 重新构建
docker compose up -d --build
```

---

## 13. 常见问题排查

### Q1: 容器启动失败

```bash
# 查看详细错误日志
docker compose logs web
docker compose logs worker

# 常见原因：
# 1. 环境变量未配置 → 检查 .env 文件
# 2. 端口被占用 → netstat -tlnp | grep 6060
# 3. 数据库未就绪 → docker compose logs postgres
```

### Q2: 搜索没有结果

```bash
# 1. 检查 PanSou API 是否正常
curl -X POST http://localhost:8888/api/search \
  -H "Content-Type: application/json" \
  -d '{"keyword":"测试"}'

# 2. 检查 PANSOU_API_URL 配置是否正确
# 3. 如果是 Docker 内互通，确保网络互通
docker compose exec web wget -qO- http://pansou:8888/api/search
```

### Q3: 转存失败

```bash
# 1. 检查夸克账号 Cookie 是否有效
# 管理后台 → 账号管理 → 查看状态

# 2. 检查账号空间是否已满
# 清理 Worker 日志查看：
docker compose logs worker | grep "delete"

# 3. 检查转存频率
# 夸克网盘有每日转存次数限制
```

### Q4: 清理任务不执行

```bash
# 1. 检查 Worker 容器是否运行
docker compose ps worker

# 2. 查看 Worker 日志
docker compose logs -f worker

# 3. 检查 Redis 连接
docker compose exec worker sh -c 'echo "PING" | nc redis 6379'

# 4. 手动触发一次清理测试
docker compose restart worker
```

### Q5: 内存占用过高

```bash
# 1. 查看各容器内存使用
docker stats --no-stream

# 2. Redis 内存限制已在 docker-compose.yml 中配置为 256MB
# 3. 如果 Postgres 占用过多，可调整 shared_buffers
# 4. 重启服务释放内存
docker compose restart
```

### Q6: 数据库备份与恢复

```bash
# 备份
docker compose exec postgres pg_dump -U wangpanso wangpanso > backup_$(date +%Y%m%d).sql

# 恢复
cat backup_20240101.sql | docker compose exec -T postgres psql -U wangpanso -d wangpanso

# 自动备份（添加到 crontab）
0 3 * * * docker compose -f /opt/wangpanso/docker-compose.yml exec -T postgres pg_dump -U wangpanso wangpanso | gzip > /opt/backups/wangpanso_$(date +\%Y\%m\%d).sql.gz
```

---

## 附录

### 环境变量完整说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DB_PASSWORD` | ✅ | `changeme123` | PostgreSQL 数据库密码 |
| `ADMIN_TOKEN` | ✅ | `changeme` | 管理后台访问令牌 |
| `PANSOU_API_URL` | ✅ | `http://localhost:8888` | PanSou 搜索 API 地址 |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `http://localhost:6060` | 网站公开访问地址（含协议和端口） |
| `NEXT_PUBLIC_SITE_NAME` | ❌ | `夸克搜` | 网站名称 |
| `PORT` | ❌ | `6060` | Web 服务对外端口（容器内固定3000） |
| `SHARE_EXPIRE_MINUTES` | ❌ | `15` | 资源过期清理周期（分钟），非夸克分享有效期 |
| `SAVE_DIR` | ❌ | `/来自搜索站` | 夸克网盘转存目录 |
| `PANSOU_AUTH_TOKEN` | ❌ | 空 | PanSou API 鉴权 Token |
| `ENCRYPTION_KEY` | ❌ | - | Cookie 加密密钥 |

### 端口占用说明

| 端口 | 服务 | 外部可访问 |
|------|------|-----------|
| 6060 | Next.js Web | 是（宿主机映射端口，建议通过 Nginx 代理） |
| 5432 | PostgreSQL | 否（仅 Docker 内部访问） |
| 6379 | Redis | 否（仅 Docker 内部访问） |
| 8888 | PanSou API | 否（建议仅内部访问） |

> **说明**：PostgreSQL 和 Redis 已移除对宿主机端口映射，仅允许 Docker 内部网络访问，无需额外安全加固。

### 生产环境安全加固

```bash
# 1. 配置防火墙（仅开放必要端口）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# 2. 定期更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 3. 设置自动安全更新
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

**部署完成！** 🎉

如有问题，请查看 [常见问题排查](#13-常见问题排查) 或提交 Issue。
