SET NAMES utf8mb4;

UPDATE timeline
SET title = '福州大学',
    payload = JSON_OBJECT(
      'category', 'Pendidikan',
      'type', '本科',
      'subtitle', '数字媒体技术专业',
      'location', '中国 福建 福州',
      'locationDetail', '',
      'period_start', '2022',
      'period_end', '2026',
      'status', 'Selesai',
      'description', '2022 年至 2026 年，本科就读于福州大学数字媒体技术专业。',
      'highlights', JSON_ARRAY('数字媒体技术专业', '本科阶段：2022 - 2026'),
      'skills', JSON_ARRAY('数字媒体技术', '编程基础', '计算机基础'),
      'extracurricular', JSON_ARRAY(),
      'responsibilities', JSON_ARRAY(),
      'projects', JSON_ARRAY(),
      'techStack', JSON_ARRAY(),
      'photos', JSON_ARRAY(),
      'quote', '',
      'quote_author', '',
      'color', 'blue',
      'icon', 'FaUniversity'
    ),
    status = 'published',
    sort_order = 1,
    visible = 1
WHERE slug = 'fuzhou-university-undergraduate';

UPDATE timeline
SET title = '哈尔滨工程大学',
    payload = JSON_OBJECT(
      'category', 'Pendidikan',
      'type', '研究生',
      'subtitle', '智能科学与技术专业',
      'location', '中国 黑龙江 哈尔滨',
      'locationDetail', '',
      'period_start', '2026',
      'period_end', '至今',
      'status', 'Sedang Berlangsung',
      'description', '2026 年开始在哈尔滨工程大学智能科学与技术专业读研，研究方向为 Visual/LiDAR SLAM、Robot Navigation。',
      'highlights', JSON_ARRAY('智能科学与技术专业', 'Visual/LiDAR SLAM', 'Robot Navigation'),
      'skills', JSON_ARRAY('Visual SLAM', 'LiDAR SLAM', 'Robot Navigation'),
      'extracurricular', JSON_ARRAY(),
      'responsibilities', JSON_ARRAY(),
      'projects', JSON_ARRAY(),
      'techStack', JSON_ARRAY(),
      'photos', JSON_ARRAY(),
      'quote', '',
      'quote_author', '',
      'color', 'green',
      'icon', 'FaBrain'
    ),
    status = 'published',
    sort_order = 2,
    visible = 1
WHERE slug = 'heu-graduate-study';
