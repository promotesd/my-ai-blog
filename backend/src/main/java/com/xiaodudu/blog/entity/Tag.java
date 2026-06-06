package com.xiaodudu.blog.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Tag {
  private Long id;
  private String name;
  private String slug;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
