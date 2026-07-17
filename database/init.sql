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
VALUES ('1412822254', '$2y$12$GE.w94U.0qLjids1nHDJuuS.G7p2gYQED2x7lSN1dzuTdIVx5PN8G', '小嘟嘟', 'admin');

INSERT INTO category (id, name, slug, description) VALUES
(1, 'Paper Reading', 'paper-reading', '论文阅读、精读笔记和方法分析'),
(2, 'Engineering Notes', 'engineering-notes', '工程实践、代码问题和部署记录');

INSERT INTO tag (id, name, slug) VALUES
(1, 'LiDAR SLAM', 'lidar-slam'),
(2, 'IMU', 'imu'),
(3, 'Robot Perception', 'robot-perception');

INSERT INTO post (id, title, slug, description, content_md, category_id, author_name, status, featured, published_at) VALUES
(1, 'LiDAR SLAM 学习路线', 'lidar-slam-roadmap', '整理 LiDAR SLAM、IMU 和机器人感知方向的入门路线。',
'# LiDAR SLAM 学习路线

这篇文章用来记录我对 LiDAR SLAM、IMU 和机器人感知方向的阶段性理解。

## 关注问题

- 点云匹配与建图
- IMU 预积分与多传感器融合
- 机器人感知与路径规划

```ts
const direction = ["LiDAR SLAM", "IMU", "Robot Perception", "Path Planning"]
```',
1, '小嘟嘟', 'published', 1, NOW()),
(2, '个人站后端第一步', 'personal-site-backend', '从 Spring Boot、MySQL 和 Redis 开始搭建长期个人站点。',
'# 个人站后端第一步

第一阶段先把博客、时间线、留言和未来项目沉淀到 MySQL，再通过 Spring Boot API 提供给 React 前端。

## 后续计划

继续补充后台编辑、评论系统、研究笔记和机器人方向学习记录。',
2, '小嘟嘟', 'published', 0, NOW());

INSERT INTO post_tag (post_id, tag_id) VALUES
(1, 1), (1, 2), (1, 3), (2, 3);

INSERT INTO paper (title, authors, venue, year, status, abstract_text, tags, pdf_url, code_url, project_url, dataset_url, featured) VALUES
('A Study Note on LiDAR SLAM and IMU Fusion', '小嘟嘟', 'Study Note', 2026, 'In Progress', '围绕 LiDAR SLAM、IMU 融合和机器人感知整理的一组研究笔记。', 'LiDAR SLAM,IMU,Robot Perception', '', '', '', '', 1),
('Path Planning Notes for Mobile Robots', '小嘟嘟', 'Study Note', 2026, 'In Progress', '探索移动机器人路径规划基础、代价地图和规划算法的学习记录。', 'Path Planning,Robotics', '', '', '', '', 0);

INSERT INTO resume_section (section_key, title, content_json, sort_order, visible) VALUES
('profile', '个人简介', JSON_OBJECT('text', '小嘟嘟 / profighted，本科就读于福州大学数字媒体技术专业，研究生就读于哈尔滨工程大学智能科学与技术专业。研究方向主要关注 LiDAR SLAM、IMU、机器人感知与路径规划。'), 1, 1),
('education', '教育经历', JSON_OBJECT('items', JSON_ARRAY(JSON_OBJECT('title', '福州大学 数字媒体技术本科', 'time', '2022 - 2026', 'text', '本科阶段学习数字媒体技术。'), JSON_OBJECT('title', '哈尔滨工程大学 智能科学与技术研究生', 'time', '2026 - 至今', 'text', '研究方向主要关注 LiDAR SLAM、IMU、机器人感知与路径规划。'))), 2, 1),
('skills', '技能栈', JSON_OBJECT('items', JSON_ARRAY()), 3, 1),
('projects', '项目经历', JSON_OBJECT('items', JSON_ARRAY()), 4, 1);

INSERT INTO comment (post_id, target_type, target_id, nickname, email, content, status) VALUES
(1, 'post', 1, '访客同学', '', '这篇路线整理得很清楚，期待后续实验记录。', 'approved'),
(NULL, 'paper', 1, '读者', '', 'SLAM 和机器人感知方向很有意思，期待后续补充。', 'approved');
