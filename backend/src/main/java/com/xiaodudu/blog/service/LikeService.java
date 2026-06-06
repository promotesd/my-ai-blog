package com.xiaodudu.blog.service;

public interface LikeService {
  int like(String targetType, Long targetId, String clientKey);

  int count(String targetType, Long targetId);
}
