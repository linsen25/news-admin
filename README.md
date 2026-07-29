# news-admin

Nuxt 3 新闻管理工作台基础架构，包含 `/login`、`/dashboard`、`/articles`、`/articles/create` 和 `/articles/edit/:id`。

```bash
npm install
npm run dev
```

默认端口为 3002。测试账号：

- `author@example.com`：编辑修改、保存草稿、提交审核。
- `reviewer@example.com`：审核中心、通过和退回文章。
- `admin@example.com`：编辑、审核、发布和账号管理。

密码任意非空。菜单和页面 middleware 按 permission 控制，API 使用 `x-mock-user-id` 执行开发期权限校验。

文章正文由 TipTap 编辑并保存为 JSON。保存草稿、预览和发布均调用 `NUXT_PUBLIC_API_BASE` 指向的 Nest API；完整闭环需要同时启动 `news-backend` 和 `news-web`。预览地址由 `NUXT_PUBLIC_WEB_BASE` 控制。上传入口仍为占位，尚未接入 Cloudinary。

后台提供统一 Toast 和 API 错误映射。保存、提交、审核和发布会显示结果提示；403 显示为“你没有权限执行该操作”。发布使用确认框，退回使用必须填写原因的确认弹窗。审核中心可查看文章 Audit Log 与 Review Comment，作者可在退回文章编辑页看到审核意见。
# Generated API types

The backend OpenAPI document is the source of truth. After regenerating
`news-backend/openapi/openapi.json`, run:

```bash
npm run generate:api-types
```

The command writes `types/generated/api.d.ts`. Do not edit that file manually.
Application-friendly aliases such as `ArticleDTO` live in `types/article.ts`.
# JWT login

The Admin login sends email and password to `POST /api/auth/login`, stores the
returned JWT in the `access-token` browser cookie, and sends
`Authorization: Bearer <token>` on protected API requests. The three Mock
accounts use password `123456`.

The current client-readable cookie is a local-development implementation.
Production should use a short-lived access token and a secure HttpOnly refresh
token cookie.
# TipTap image upload

The editor toolbar includes an image button. It uploads the selected file to
the protected Backend Upload API, prompts for alt text and an optional caption,
then inserts the returned Cloudinary URL into TipTap JSON.

The browser sends only the file and JWT. Cloudinary secrets remain in the
backend environment.

# SEO and media library

The article form includes slug, meta title, meta description, and comma-
separated keyword fields. `/media` lists Cloudinary assets, uploader, upload
time, and article reference count. Referenced assets have deletion disabled;
the backend independently enforces the same rule with HTTP 409.
