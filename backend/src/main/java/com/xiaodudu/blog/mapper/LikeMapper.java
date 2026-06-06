package com.xiaodudu.blog.mapper;

import org.apache.ibatis.annotations.Param;

public interface LikeMapper {
  int exists(@Param("targetType") String targetType, @Param("targetId") Long targetId, @Param("clientKey") String clientKey);

  int insert(@Param("targetType") String targetType, @Param("targetId") Long targetId, @Param("clientKey") String clientKey);

  int count(@Param("targetType") String targetType, @Param("targetId") Long targetId);
}
