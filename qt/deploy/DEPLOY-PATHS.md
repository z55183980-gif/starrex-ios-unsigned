# 部署路径对照（必读）

> 当前 StarRex 生产域名：会员端 `https://ss2211.cc`、管理端 `https://admin.ss2211.cc`、API/WS 使用同域路径。
> 生产前端由根目录 `deploy/web/Dockerfile` 构建并运行在 Docker Web 容器中，不再部署到旧的 `www.slc8.com` 静态站点目录。

## 命名约定

| 环境 | 后端项目目录名 | 说明 |
|------|----------------|------|
| **本地 Windows** | `wwwstarlc` | 如 `C:\Users\PC\Desktop\SLC\wwwstarlc` |
| **线上 Linux** | `webman` | 如 `/www/wwwroot/webman` |

**线上不要使用** `/www/wwwroot/wwwstarlc/`（除非你自己建了软链；默认不存在）。

## 线上标准路径（api / Webman）

```text
/www/wwwroot/webman/                          # 项目根（宝塔「网站目录」指这里）
/www/wwwroot/webman/public/                   # Webman 对外静态根
/www/wwwroot/webman/public/uploads/           # 会员上传、快捷入口图标等
/www/wwwroot/webman/public/uploads/icons/
/www/wwwroot/webman/public/touxiang/          # 头像
/www/wwwroot/webman/plugin/admin/public/upload/       # 后台上传静态（Nginx 只 alias 此目录）
/www/wwwroot/webman/plugin/admin/public/upload/img/   # 活动富文本、平台图等
# 注意：/app/admin/account/info 等是 API，走 8788，不能对整个 /app/admin/ 做 alias
```

## 线上标准路径（ss2211.cc / qt 会员前端）

```text
https://ss2211.cc/                            # 会员端生产域名
/srv/member/                                  # Web 容器内的会员端静态文件目录
# 内容由 deploy/web/Dockerfile 执行 qt 的 npm run build 后复制到 /srv/member
# Nginx 将 ss2211.cc 反向代理到 127.0.0.1:18080
```

## 线上标准路径（admin / ht 管理前端）

```text
https://admin.ss2211.cc/                      # 管理端生产域名
/srv/admin/                                   # Web 容器内的管理端静态文件目录
# 内容由 deploy/web/Dockerfile 执行 ht 的 npm run build 后复制到 /srv/admin
```

管理端 **接口** 不在 admin 域名下，应配置为：

```text
https://ss2211.cc/app/admin/account/info
```

**错误**：`VITE_API_URL=/api` → 请求变成 `/api/app/admin/...` → **404**  
**错误**：`VITE_API_PROXY_URL=https://6668m.cc`（旧域名）

## 本地 ↔ 线上对照

| 用途 | 本地路径 | 线上路径 |
|------|----------|----------|
| 后端代码 | `...\SLC\wwwstarlc\` | `/www/wwwroot/webman/` |
| 会员 uploads | `...\wwwstarlc\public\uploads\` | `/www/wwwroot/webman/public/uploads/` |
| 后台活动图 | `...\wwwstarlc\plugin\admin\public\upload\img\` | `/www/wwwroot/webman/plugin/admin/public/upload/img/` |
| 会员前端 dist | `...\SLC\qt\dist\` | Web 容器 `/srv/member/`，域名 `https://ss2211.cc` |
| 管理前端 dist | `...\SLC\ht\dist\` | Web 容器 `/srv/admin/`，域名 `https://admin.ss2211.cc` |

## Nginx 配置片段（当前生产）

以仓库根目录的容器部署配置为准：

- `deploy/nginx/ss2211.cc.container.conf`
- `deploy/nginx/admin.ss2211.cc.container.conf`
- `deploy/server-deploy.sh`

本目录下名称包含 `slc8.com` 的 Nginx 文件仅保留作旧版宝塔静态部署参考，不代表当前生产域名。

其他排查文档：

- `UPLOADS-STATIC.md` — 静态资源排查
- `CORS-API.md` — `ERR_FAILED 200 (OK)` 跨域排查（含 customer-service）

## 管理端（ht）与会员端相同的媒体问题

| 现象 | 原因 | 处理 |
|------|------|------|
| 活动/通知富文本图裂 | DB 含 `web.hwyla8.net/siteadmin/upload/...` | `ht/src/utils/mediaUrl.ts`：`prepareActivityHtml` 加载时改写 |
| 封面 `/app/admin/upload/...` 在 admin 域 404 | 静态只在 **api** | **ht**：接口响应自动 `rewriteMediaUrlsInData`；展示用 `resolveMediaUrl` / `v-media-src`；上传 `ADMIN_IMAGE_UPLOAD_ACTION` |
| 编辑器上传失败 | 曾用 `/api/common/upload/wangeditor` | 改为 `/app/admin/upload/image`（`adminUploadImageUrl()`） |
| 上传报「网络连接异常/上传失败」 | Nginx `^~ /app/admin/upload/` 把 API 当静态文件 → OPTIONS/POST 405 | 静态只配 `upload/img|files|avatar/`，勿匹配 `/upload/image` |
| 保存后 URL 带 api 域名 | 编辑时展示用绝对地址 | 保存前 `normalizeContentForSave` / `normalizeUrlForSave` |

**不必**在 `admin.ss2211.cc` 上对整段 `/app/admin/` 做 alias（会干扰管理 API）。图片静态走会员域名的 `location ^~ /app/admin/upload/img/`（及 `files/`、`avatar/`），上传接口仍反代 8788。

管理端部署：`ht/.env.production` 中：

- `VITE_API_URL=https://admin.ss2211.cc`
- `VITE_WS_URL=wss://admin.ss2211.cc/admin-ws`（管理推送 8790）
- `VITE_CHAT_WS_URL=wss://admin.ss2211.cc/ws`（聊天/IM 客服 8789）

生产构建由 `deploy/web/Dockerfile` 完成。StarRex 的 WebSocket 使用 `ss2211.cc` 与 `admin.ss2211.cc` 的同域路径。

## 仓库内已检查范围（2026-07）

- `deploy/*` — 当前 `ss2211.cc` Docker 生产部署配置
- `qt/deploy/*` — 旧版宝塔静态部署参考
- `qt/src`、`qt/vite.config.js` — 无错误 `wwwroot/wwwstarlc` 硬编码
- `wwwstarlc/` 源码 — 无服务器绝对路径
- `ht/src/utils/mediaUrl.ts` — 与 qt 对齐的旧图床改写

若在宝塔仍填写「你的后端站点目录」或 `wwwstarlc`，请改为 **`webman`**。
