CREATE DATABASE IF NOT EXISTS xiaodudu_blog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xiaodudu_blog;

DROP TABLE IF EXISTS comment;
DROP TABLE IF EXISTS like_record;
DROP TABLE IF EXISTS post_tag;
DROP TABLE IF EXISTS resume_section;
DROP TABLE IF EXISTS paper;
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS post;
DROP TABLE IF EXISTS tag;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  avatar_url VARCHAR(500),
  role VARCHAR(50) DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE category (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tag (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE post (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description VARCHAR(500),
  content_md LONGTEXT NOT NULL,
  cover_url VARCHAR(500),
  category_id BIGINT,
  author_name VARCHAR(100),
  status VARCHAR(30) DEFAULT 'draft',
  featured TINYINT DEFAULT 0,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at DATETIME,
  CONSTRAINT fk_post_category FOREIGN KEY (category_id) REFERENCES category(id)
);

CREATE TABLE post_tag (
  post_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_post_tag_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_tag_tag FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

CREATE TABLE project (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description VARCHAR(500),
  content_md LONGTEXT,
  tech_stack VARCHAR(500),
  status VARCHAR(50),
  category VARCHAR(100),
  github_url VARCHAR(500),
  demo_url VARCHAR(500),
  docs_url VARCHAR(500),
  cover_url VARCHAR(500),
  featured TINYINT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE paper (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(300) NOT NULL,
  authors VARCHAR(500),
  venue VARCHAR(200),
  year INT,
  status VARCHAR(50),
  abstract_text TEXT,
  tags VARCHAR(500),
  pdf_url VARCHAR(500),
  code_url VARCHAR(500),
  project_url VARCHAR(500),
  dataset_url VARCHAR(500),
  featured TINYINT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE resume_section (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  section_key VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content_json JSON,
  sort_order INT DEFAULT 0,
  visible TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE comment (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT,
  target_type VARCHAR(30) NOT NULL DEFAULT 'post',
  target_id BIGINT NOT NULL,
  nickname VARCHAR(100),
  email VARCHAR(200),
  content TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE
);

CREATE TABLE like_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  target_type VARCHAR(30) NOT NULL,
  target_id BIGINT NOT NULL,
  client_key VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_like_target_client (target_type, target_id, client_key)
);

INSERT INTO `user` (username, password_hash, nickname, role)
VALUES ('admin', '$2a$10$/pPJelMJ4EDlB7at5m6hq.btR5cskftnYcfJfoxmzkC5W91CClox2', 'Agung', 'admin');

INSERT INTO category (id, name, slug, description) VALUES
(1, 'Paper Reading', 'paper-reading', '论文阅读、精读笔记和方法分析'),
(2, 'Engineering Notes', 'engineering-notes', '工程实践、代码问题和部署记录');

INSERT INTO tag (id, name, slug) VALUES
(1, 'VLM', 'vlm'),
(2, 'Remote Sensing', 'remote-sensing'),
(3, 'RAG', 'rag');

INSERT INTO post (id, title, slug, description, content_md, category_id, author_name, status, featured, published_at) VALUES
(1, '遥感 VLM 学习路线', 'remote-sensing-vlm-roadmap', '整理遥感视觉、多模态学习和 VLM 研究的入门路线。',
'# 遥感 VLM 学习路线

这篇文章用来记录我对遥感视觉、多模态学习与 Vision-Language Model 的阶段性理解。

## 关注问题

- 遥感影像的视觉语义对齐
- 多尺度目标与开放词表识别
- VLM 与 RAG 结合后的知识增强问答

```ts
const direction = ["Remote Sensing", "VLM", "RAG"]
```',
1, '小嘟嘟', 'published', 1, NOW()),
(2, '个人知识库后端第一步', 'personal-knowledge-backend', '从数据库、接口和内容模型开始搭建长期个人站点。',
'# 个人知识库后端第一步

第一阶段先把博客、论文、项目和简历沉淀到 MySQL，再通过 Spring Boot API 提供给前端。

## 后续计划

继续补充后台编辑、评论系统、RAG 问答和知识图谱。',
2, '小嘟嘟', 'published', 0, NOW());

INSERT INTO post_tag (post_id, tag_id) VALUES
(1, 1), (1, 2), (1, 3), (2, 3);

INSERT INTO project (title, slug, description, content_md, tech_stack, status, category, github_url, demo_url, docs_url, featured) VALUES
('个人 AI Blog 全栈系统', 'ai-blog-fullstack', 'Vue3 + Spring Boot + MyBatis + MySQL 的个人内容系统。', '用于承载博客、研究记录、项目展示和未来 RAG 问答。', 'Vue3,Spring Boot,MyBatis,MySQL,Tailwind CSS', 'Building', 'Web App', 'https://github.com/promotesd', '', '', 1),
('遥感 VLM 实验记录库', 'remote-sensing-vlm-lab', '面向遥感视觉语言模型的实验记录、论文笔记和数据整理。', '后续会沉淀模型结构、实验复盘和数据集整理。', 'Python,PyTorch,VLM,RAG', 'Research Prototype', 'AI Research', '', '', '', 0);

INSERT INTO paper (title, authors, venue, year, status, abstract_text, tags, pdf_url, code_url, project_url, dataset_url, featured) VALUES
('A Study Note on Remote Sensing Vision-Language Models', '张林奕涵', 'Preprint', 2026, 'In Progress', '围绕遥感影像语义理解、跨模态对齐和开放词表识别整理的一组研究笔记。', 'Remote Sensing,VLM,Multimodal Learning', '', '', '', '', 1),
('RAG for Personal Academic Knowledge Base', '张林奕涵', 'Project Manuscript', 2026, 'In Progress', '探索将个人博客、论文笔记和项目文档接入 RAG 问答系统的方法。', 'RAG,Knowledge Base,Agent', '', '', '', '', 0);

INSERT INTO resume_section (section_key, title, content_json, sort_order, visible) VALUES
('profile', '个人简介', JSON_OBJECT('text', '张林奕涵，关注 AI、遥感视觉、多模态学习、VLM 与 RAG。希望把科研、工程和写作沉淀成长期可维护的个人知识系统。'), 1, 1),
('education', '教育经历', JSON_OBJECT('items', JSON_ARRAY(JSON_OBJECT('title', '本科 / 研究方向', 'time', '2022 - 至今', 'text', '学习计算机视觉、深度学习、遥感影像理解与 Web 工程。'))), 2, 1),
('skills', '技能栈', JSON_OBJECT('items', JSON_ARRAY(JSON_OBJECT('title', 'AI & Research', 'text', 'Python、PyTorch、Computer Vision、VLM、RAG'), JSON_OBJECT('title', 'Engineering', 'text', 'Vue3、Spring Boot、MyBatis、MySQL、Git、Linux'))), 3, 1),
('projects', '项目经历', JSON_OBJECT('items', JSON_ARRAY(JSON_OBJECT('title', '个人 AI Blog 全栈系统', 'text', '负责从数据库、后端接口到前端页面的全栈实现，用于长期沉淀博客、简历、论文和项目。'))), 4, 1);

INSERT INTO comment (post_id, target_type, target_id, nickname, email, content, status) VALUES
(1, 'post', 1, '访客同学', '', '这篇路线整理得很清楚，期待后续实验记录。', 'approved'),
(NULL, 'project', 1, '研究朋友', '', '项目结构很适合作为个人知识库起点。', 'approved'),
(NULL, 'paper', 1, '读者', '', '遥感 VLM 方向很有意思，可以继续补数据集对比。', 'approved');
