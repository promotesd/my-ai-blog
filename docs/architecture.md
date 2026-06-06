# Portfolio Architecture

本项目正在从 Next.js + Supabase 作品集迁移为可独立部署的前后端架构。

## 技术栈

- `frontend/`：React 19、Vite、TypeScript、React Router、Tailwind CSS
- `backend/`：Spring Boot 3、Java 17、MyBatis、Spring JDBC、JWT
- `database/`：MySQL 8 初始化脚本和 portfolio 增量迁移
- Redis：公开内容缓存，以及留言、点赞、上传限流

## 第一阶段

后端保留旧博客接口，同时新增 portfolio API：

- 公开接口：`/api/blogs`、`/api/projects`、`/api/skills`、`/api/certificates`、`/api/timelines`、`/api/work-experiences`、`/api/coding-journey`、`/api/tech-tools`、`/api/deployed-projects`、`/api/diaries`、`/api/guestbook`、`/api/portfolio-stats`
- 后台 CRUD：`/api/admin/{resource}`
- 登录：`POST /api/auth/login`
- 上传：`POST /api/upload/files`

动态 portfolio 表保留 `slug`、`title`、`status`、`sort_order`、`visible` 等公共字段，其余业务字段写入 MySQL `JSON`。服务端使用资源白名单映射表名，客户端不能提交任意表名或 SQL。

## 本地启动

1. 启动 MySQL 和 Redis：

   ```bash
   docker compose up -d
   ```

2. 启动后端：

   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. 启动前端：

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

开发环境默认账号为 `admin / admin123`。生产环境必须替换 `JWT_SECRET`，并修改初始化账号密码。

## 数据迁移

- `database/init.sql` 用于全新数据库。
- `database/portfolio_phase1.sql` 是兼容旧博客模型的增量脚本，可单独执行。
- portfolio 表的复杂字段保存在 `payload` JSON 中，可以用 MySQL JSON、CSV 或自定义脚本继续导入原 Supabase 数据。

## 部署

`docker-compose.yml` 提供 MySQL 和 Redis 的持久化开发基础设施。云服务器部署时，前端由 Nginx 托管静态文件，并将 `/api` 和 `/uploads` 反向代理至 Spring Boot。

## 第二阶段

后续接管图库、访客图库、娱乐内容、通知、访客统计和第三方 API 代理。Supabase realtime 将由 Redis + SSE 替代。
