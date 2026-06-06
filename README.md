# 小嘟嘟个人站点

这是一个前后端分离的个人学术主页、技术博客和研究作品集项目。

当前技术栈：

- Frontend：Vue 3、Vite、TypeScript、Vue Router、Pinia、Axios、Tailwind CSS、lucide-vue-next、markdown-it、highlight.js
- Backend：Java 17、Spring Boot 3、Spring Web、Spring Validation、MyBatis、MySQL Driver、Lombok
- Database：MySQL 8+

## 项目结构

```txt
my-ai-blog/
├── frontend/
├── backend/
├── database/
├── docs/
├── README.md
└── .git/
```

## 初始化 MySQL

先确保本地 MySQL 已启动，然后执行：

```bash
mysql -u root -p < database/init.sql
```

默认数据库名：

```txt
xiaodudu_blog
```

默认后端数据库配置在 `backend/src/main/resources/application.yml`：

```yaml
username: root
password: root
```

如果你的本地 MySQL 密码不是 `root`，请修改该文件。

## 启动后端

```bash
cd backend
mvn spring-boot:run
```

健康检查：

```txt
http://localhost:8080/api/health
```

## 启动前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端默认读取：

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

访问：

```txt
http://localhost:5173/
```

## 页面路由

- `/`：首页，使用网名“小嘟嘟”
- `/blog`：博客列表
- `/blog/:slug`：博客详情
- `/lab`：实验室，展示论文和项目
- `/resume`：简历页面，使用真名“张林奕涵”
- `/admin/login`：后台登录占位
- `/admin/posts`：文章管理占位
- `/admin/posts/edit/:id`：文章编辑占位

## 后端接口

统一返回结构：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

第一阶段接口：

- `GET /api/health`
- `GET /api/posts`
- `GET /api/posts/{slug}`
- `GET /api/categories`
- `GET /api/tags`
- `GET /api/projects`
- `GET /api/papers`
- `GET /api/resume`
- `POST /api/auth/login`

第二阶段已新增：

- `GET /api/posts/admin`：后台文章列表，需要 JWT
- `GET /api/posts/admin/{id}`：后台文章详情，需要 JWT
- `POST /api/posts/admin`：新增文章，需要 JWT
- `PUT /api/posts/admin/{id}`：编辑文章，需要 JWT
- `DELETE /api/posts/admin/{id}`：删除文章，需要 JWT
- `GET /api/projects/{slug}`：项目详情
- `GET /api/papers/{id}`：论文详情
- `GET /api/comments?targetType=post&targetId=1`：评论列表
- `POST /api/comments`：发表评论
- `GET /api/likes?targetType=post&targetId=1`：点赞数
- `POST /api/likes?targetType=post&targetId=1`：点赞
- `POST /api/upload/image`：图片上传，需要 JWT

mock 登录账号：

```txt
admin / admin123
```

登录成功后会返回 JWT，前端会自动放入 `Authorization: Bearer <token>`。

## 数据表

`database/init.sql` 会创建：

- `user`：管理员用户
- `post`：博客文章
- `category`：博客分类
- `tag`：博客标签
- `post_tag`：文章标签关联
- `project`：项目
- `paper`：论文
- `resume_section`：简历模块
- `comment`：评论，第一阶段只建表不开放接口
- `like_record`：点赞去重记录

评论表现在支持通用目标：

- `target_type=post`
- `target_type=project`
- `target_type=paper`

## 后台使用

1. 访问 `/admin/login`
2. 使用 `admin / admin123` 登录
3. 进入 `/admin/posts`
4. 点击“新增文章”或“编辑”
5. 可填写 Markdown、分类、标签、封面图、发布状态

图片会上传到后端 `backend/uploads/`，并通过 `/uploads/文件名` 访问。

后台现有模块：

- `/admin/posts`：文章管理
- `/admin/taxonomy`：分类与标签管理
- `/admin/projects`：项目管理
- `/admin/papers`：论文管理
- `/admin/comments`：评论审核
- `/admin/images`：图片库管理

管理员路由已加前端守卫，未登录访问 `/admin/*` 会跳转到 `/admin/login`。

## 下一阶段建议

1. 后台文章新增、编辑、删除、发布和草稿接口。
1. token 过期后的自动刷新或更友好的重新登录提示。
2. 评论反垃圾、敏感词和验证码。
3. 图片裁剪、压缩和对象存储。
4. 项目/论文详情页的后台富文本预览。
5. Docker Compose 一键启动 MySQL + 后端 + 前端。
6. 接入个人知识库 RAG 问答。
