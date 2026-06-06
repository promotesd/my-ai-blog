package com.xiaodudu.blog.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Comment {
  private Long id;
  private Long postId;
  private String targetType;
  private Long targetId;
  private String nickname;
  private String email;
  private String content;
  private String status;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
