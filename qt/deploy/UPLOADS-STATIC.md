# 静态资源与 `/uploads`、`/app/admin`

路径总表见 **[DEPLOY-PATHS.md](./DEPLOY-PATHS.md)**（本地 `wwwstarlc` → 线上 `webman`）。

## 线上目录（api）

| 类型 | URL | 磁盘 |
|------|-----|------|
| 快捷入口图标 | `https://api.slc8.com/uploads/icons/...` | `/www/wwwroot/webman/public/uploads/icons/` |
| 活动/后台上传图 | `https://api.slc8.com/app/admin/upload/img/...` | `/www/wwwroot/webman/plugin/admin/public/upload/img/` |

磁盘已有文件时，会员端应请求 **api 域** 的 `/uploads/...`（`VITE_MEDIA_BASE_URL=https://api.slc8.com`），不要用 `www.slc8.com/uploads`。仅图片加载失败时才用 `qt/public/assets/img` 本地 SVG。

旧库 `siteadmin/upload/...` 在代码中会转为 `/app/admin/upload/...`。

## Nginx（api.slc8.com，写在反代 8788 之前）

```nginx
location /uploads/ {
    alias /www/wwwroot/webman/public/uploads/;
    expires 30d;
    add_header Access-Control-Allow-Origin *;
}

# 仅静态子目录！勿写 location ^~ /app/admin/upload/（会挡住上传 API
# /app/admin/upload/image|file|avatar → 405 → 前端「网络连接异常」）
location ^~ /app/admin/upload/img/ {
    alias /www/wwwroot/webman/plugin/admin/public/upload/img/;
    expires 30d;
    add_header Access-Control-Allow-Origin *;
}
location ^~ /app/admin/upload/files/ {
    alias /www/wwwroot/webman/plugin/admin/public/upload/files/;
    expires 30d;
    add_header Access-Control-Allow-Origin *;
}
location ^~ /app/admin/upload/avatar/ {
    alias /www/wwwroot/webman/plugin/admin/public/upload/avatar/;
    expires 30d;
    add_header Access-Control-Allow-Origin *;
}

location /touxiang/ {
    alias /www/wwwroot/webman/public/touxiang/;
    expires 30d;
}
```

完整示例：`nginx-api.slc8.com.conf.example`

## 自检命令

```bash
# 勿使用 /www/wwwroot/wwwstarlc/（线上默认无此目录）
ls -la /www/wwwroot/webman/public/uploads/icons/icon_dt_1yeb.avif
ls -la /www/wwwroot/webman/plugin/admin/public/upload/img/1771866511772987393.avif

curl -I https://api.slc8.com/uploads/icons/icon_dt_1yeb.avif
curl -I https://api.slc8.com/app/admin/upload/img/1771866511772987393.avif
```

均应 **HTTP 200**。

## 宝塔注意

- **api.slc8.com** 网站目录 → `/www/wwwroot/webman`
- 配置里 `alias` 必须用 **`webman`**，不要用 `wwwstarlc` 或「你的后端站点目录」占位符

## 本地同步到线上

| 本地 | 线上 |
|------|------|
| `wwwstarlc\public\uploads\` | `webman/public/uploads/` |
| `wwwstarlc\plugin\admin\public\upload\` | `webman/plugin/admin/public/upload/` |

```bash
chown -R www:www /www/wwwroot/webman/public/uploads
chown -R www:www /www/wwwroot/webman/plugin/admin/public/upload
```

## 后台上传 URL 格式

新上传（`UploadController`）返回：

```text
/app/admin/upload/img/20260520/随机名.avif
```

磁盘：`plugin/admin/public/upload/img/20260520/随机名.avif`

若库里只有 `/app/admin/upload/img/文件名.avif`（无日期目录），而文件实际在 `img/20260520/` 下，会 **404** — 需在库里改路径或把文件挪到对应 URL 位置。

## 会员端活动图 404

活动 `banner` 若为 `/app/admin/upload/...`，必须由前端 `resolveMediaUrl` 转为 `https://api.slc8.com/...`，否则会在 **www** 域名下请求而 404。已改活动相关页面。

## 前端

`VITE_MEDIA_BASE_URL=https://api.slc8.com` 会解析 `/uploads/...` 与 `/app/admin/upload/...`。
