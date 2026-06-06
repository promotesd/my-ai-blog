package com.xiaodudu.blog.entity;

import lombok.Data;

@Data
public class LikeRecord {
  private Long id;
  private String targetType;
  private Long targetId;
  private String clientKey;
}
