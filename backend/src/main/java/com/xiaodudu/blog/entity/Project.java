package com.xiaodudu.blog.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Project {
  private Long id;
  private String title;
  private String slug;
  private String description;
  private String contentMd;
  private String techStack;
  private String status;
  private String category;
  private String githubUrl;
  private String demoUrl;
  private String docsUrl;
  private String coverUrl;
  private Boolean featured;
  private Integer likeCount;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
