# PaperHub Cloudflare Workers 部署指南

## 目录结构

```
workers/
├── index.js              # Workers 入口
├── wrangler.toml         # Cloudflare Workers 配置
├── package.json          # 依赖
└── api/                  # API 路由
    ├── papers.js
    ├── push.js
    ├── tags.js
    ├── categories.js
    ├── auth.js
    ├── user.js
    └── cron.js
```

## 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 设置环境变量

```bash
# 设置 Cron 密钥
wrangler secret put CRON_SECRET
```

### 4. 部署 Workers

```bash
cd workers
npm install
wrangler deploy
```

部署成功后会得到一个 `*.workers.dev` 域名。

### 5. 绑定自定义域名（可选）

在 Cloudflare Dashboard 中：
1. 进入 Workers & Pages
2. 选择你的 Worker
3. 点击 Triggers → Custom Domains
4. 添加你的域名

## 前端配置

部署 Workers 后，需要修改前端的 API 地址。

编辑 `js/app.js` 中的 API_BASE_URL：

```javascript
const API_BASE_URL = 'https://api.yourpaperhub.workers.dev/api';
```

## 定时任务

Cloudflare Workers 有内置的 Cron Triggers，配置在 `wrangler.toml` 中：

```toml
[triggers]
crons = ["0 8 * * *"]  # 每天 UTC 8点
```

如果需要更强的可靠性，可以使用 GitHub Actions 触发：

1. 在 GitHub 仓库设置 `CRON_SECRET`
2. 修改 `.github/workflows/cron.yml` 中的 URL 为你的 Workers 地址

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/papers` | GET | 获取论文列表 |
| `/api/papers/hot` | GET | 获取热门论文 |
| `/api/papers/search/:query` | GET | 搜索论文 |
| `/api/papers/:id` | GET | 获取论文详情 |
| `/api/push/daily` | GET | 获取今日推送 |
| `/api/push/history` | GET | 获取推送历史 |
| `/api/tags` | GET | 获取标签列表 |
| `/api/categories` | GET | 获取分类 |
| `/api/auth/login` | POST | 登录 |
| `/api/auth/register` | POST | 注册 |
| `/api/user/profile` | GET | 获取用户信息 |
| `/api/cron` | GET | 定时任务触发 |
