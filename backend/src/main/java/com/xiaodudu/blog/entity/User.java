package com.xiaodudu.blog.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class User {
  private Long id;
  private String username;
  private String passwordHash;
  private String nickname;
  private String avatarUrl;
  private String role;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
