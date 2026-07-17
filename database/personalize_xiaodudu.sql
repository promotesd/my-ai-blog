USE xiaodudu_blog;

INSERT INTO `user` (username, password_hash, nickname, role)
VALUES ('1412822254', '$2y$12$GE.w94U.0qLjids1nHDJuuS.G7p2gYQED2x7lSN1dzuTdIVx5PN8G', '小嘟嘟', 'admin')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  nickname = VALUES(nickname),
  role = VALUES(role);

DELETE FROM `user` WHERE username = 'admin';

DELETE FROM popular_project;
DELETE FROM project_github_url;
DELETE FROM deployed_project;
DELETE FROM work_experience;
DELETE FROM skill;
DELETE FROM certificate;
DELETE FROM coding_journey;
DELETE FROM timeline;
DELETE FROM project;
DELETE FROM blog;

UPDATE portfolio_stats
SET payload = JSON_OBJECT(
      'projects', 0,
      'years_experience', 0,
      'technologies', 0,
      'certificates', 0,
      'contributions', 0,
      'hidden_projects_count', 0
    ),
    visible = 1,
    updated_at = NOW()
WHERE title = 'Portfolio Stats';

INSERT IGNORE INTO portfolio_stats (title, payload, sort_order, visible)
VALUES (
  'Portfolio Stats',
  JSON_OBJECT(
    'projects', 0,
    'years_experience', 0,
    'technologies', 0,
    'certificates', 0,
    'contributions', 0,
    'hidden_projects_count', 0
  ),
  1,
  1
);

INSERT INTO timeline (slug, title, payload, status, sort_order, visible) VALUES
(
  'fuzhou-university-undergraduate',
  '福州大学',
  JSON_OBJECT(
    'category', 'Pendidikan',
    'type', '本科',
    'subtitle', '数字媒体技术专业',
    'location', '中国 福建 福州',
    'period_start', '2022',
    'period_end', '2026',
    'status', 'Selesai',
    'description', '本科阶段就读于福州大学数字媒体技术专业，学习编程、交互、图形和内容系统相关基础。',
    'highlights', JSON_ARRAY('数字媒体技术专业', '本科阶段：2022 - 2026', '持续积累计算机与工程基础'),
    'skills', JSON_ARRAY('数字媒体技术', '编程基础', '计算机基础'),
    'photos', JSON_ARRAY(),
    'quote', '把基础打牢，再慢慢走向更复杂的问题。',
    'quote_author', '小嘟嘟',
    'color', 'blue',
    'icon', 'FaUniversity'
  ),
  'published',
  1,
  1
),
(
  'heu-graduate-study',
  '哈尔滨工程大学',
  JSON_OBJECT(
    'category', 'Pendidikan',
    'type', '研究生',
    'subtitle', '智能科学与技术专业',
    'location', '中国 黑龙江 哈尔滨',
    'period_start', '2026',
    'period_end', 'Sekarang',
    'status', 'Sedang Berlangsung',
    'description', '2026 年开始研究生阶段学习，研究方向主要关注 LiDAR SLAM、IMU、机器人感知与路径规划。',
    'highlights', JSON_ARRAY('智能科学与技术专业', '研究方向：LiDAR SLAM、IMU、机器人感知、路径规划', '研究生阶段：2026 至今'),
    'skills', JSON_ARRAY('LiDAR SLAM', 'IMU', '机器人感知', '路径规划'),
    'photos', JSON_ARRAY(),
    'quote', '保持好奇，持续复现，认真记录。',
    'quote_author', '小嘟嘟',
    'color', 'green',
    'icon', 'FaBrain'
  ),
  'published',
  2,
  1
);

INSERT INTO coding_journey (slug, title, payload, status, sort_order) VALUES
(
  'fuzhou-university-undergraduate',
  '福州大学数字媒体技术本科',
  JSON_OBJECT(
    'year', '2022 - 2026',
    'description', '本科阶段就读于福州大学数字媒体技术专业。',
    'icon_key', 'GraduationCap',
    'color', 'from-blue-500 to-cyan-500',
    'is_published', true
  ),
  'published',
  1
),
(
  'heu-graduate-study',
  '哈尔滨工程大学智能科学与技术研究生',
  JSON_OBJECT(
    'year', '2026 - 至今',
    'description', '研究方向主要关注 LiDAR SLAM、IMU、机器人感知与路径规划。',
    'icon_key', 'Brain',
    'color', 'from-emerald-500 to-accentColor',
    'is_published', true
  ),
  'published',
  2
);
