package com.xiaodudu.blog.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Category {
  private Long id;
  private String name;
  private String slug;
  private String description;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
