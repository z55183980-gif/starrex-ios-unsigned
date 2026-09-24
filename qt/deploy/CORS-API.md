# api.slc8.com 跨域（CORS）排查

## 现象

浏览器 Console / Network：

```text
GET https://api.slc8.com/api/v1/im/customer-service?lang=zh-hans
net::ERR_FAILED 200 (OK)
```

或：`No 'Access-Control-Allow-Origin' header` + **HTTP 404**。

## 路由 404（更常见根因）

| URL | 结果 |
|-----|------|
| `/api/v1/im/customer-service` | **404** — 线上未注册（qt 前端用的路径） |
| `/api/im/customer-service` | **200** — 旧路由，CORS 正常 |

修复：在 `wwwstarlc/config/route.php` 的 `/api/v1` 鉴权组内增加 `/im/*`（与 `qt/src/api/im.js` 一致），重启 Webman。

若 `curl` 对 `/api/v1/im/...` 已是 200 且带 `Access-Control-Allow-Origin: https://www.slc8.com`，则 CORS 无需再改 Nginx。

---

## 纯 CORS（非 404 时）

说明 **服务器已返回 200**，但浏览器 **拒绝把响应交给前端**（响应头重复或非法）。

## 常见原因

1. **Nginx 与 Webman 各加一遍** `Access-Control-Allow-Origin`（宝塔「跨域」插件或手写 `add_header`）。
2. 同时返回 `Access-Control-Allow-Origin: *` 与 `Access-Control-Allow-Credentials: true`（带 `Authorization` 的跨域请求不允许）。
3. `config/cors.php` 未包含实际前端域名（如 `https://www.slc8.com`）。

## 正确做法

- **仅 Webman** `app/middleware/CorsMiddleware.php` 输出 CORS（已配置 `config/cors.php` 白名单）。
- **api 站点** 反代 `location ^~ / { proxy_pass 8788; }` **不要** `add_header Access-Control-*`。
- 静态目录 `/uploads/`、`/app/admin/upload/` 上的 `add_header Access-Control-Allow-Origin *` **可以保留**（仅图片，不带 Token）。

## 服务器自检

```bash
curl -sI -H "Origin: https://www.slc8.com" \
  "https://api.slc8.com/api/v1/im/customer-service"
```

期望（有 Token 时可能为 401，但 CORS 头仍应正确）：

- **一行** `Access-Control-Allow-Origin: https://www.slc8.com`
- `Access-Control-Expose-Headers` 含 `X-Encrypted`（接口加密时前端需读此头）
- **不要** 出现两个 `Allow-Origin`

## 代码部署

1. 上传/同步 `wwwstarlc` 中 `CorsMiddleware.php`、`config/cors.php`。
2. 重启 Webman：`php start.php restart`（或宝塔进程管理）。
3. 修改 Nginx 后 `nginx -t && nginx -s reload`。
4. 会员端重新 `npm run build` 部署 `www.slc8.com`（可选，仅改进了错误提示文案）。
