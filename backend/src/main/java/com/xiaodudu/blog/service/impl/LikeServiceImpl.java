package com.xiaodudu.blog.service.impl;

import com.xiaodudu.blog.mapper.LikeMapper;
import com.xiaodudu.blog.mapper.PaperMapper;
import com.xiaodudu.blog.mapper.PostMapper;
import com.xiaodudu.blog.mapper.ProjectMapper;
import com.xiaodudu.blog.service.LikeService;
import org.springframework.stereotype.Service;

@Service
public class LikeServiceImpl implements LikeService {
  private final LikeMapper likeMapper;
  private final PostMapper postMapper;
  private final ProjectMapper projectMapper;
  private final PaperMapper paperMapper;

  public LikeServiceImpl(LikeMapper likeMapper, PostMapper postMapper, ProjectMapper projectMapper, PaperMapper paperMapper) {
    this.likeMapper = likeMapper;
    this.postMapper = postMapper;
    this.projectMapper = projectMapper;
    this.paperMapper = paperMapper;
  }

  @Override
  public int like(String targetType, Long targetId, String clientKey) {
    String key = clientKey == null || clientKey.isBlank() ? "anonymous" : clientKey;
    if (likeMapper.exists(targetType, targetId, key) == 0) {
      likeMapper.insert(targetType, targetId, key);
      if ("post".equals(targetType)) {
        postMapper.incrementLikeCount(targetId);
      } else if ("project".equals(targetType)) {
        projectMapper.incrementLikeCount(targetId);
      } else if ("paper".equals(targetType)) {
        paperMapper.incrementLikeCount(targetId);
      }
    }
    return likeMapper.count(targetType, targetId);
  }

  @Override
  public int count(String targetType, Long targetId) {
    return likeMapper.count(targetType, targetId);
  }
}
