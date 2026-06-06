package com.xiaodudu.blog.entity;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;

@Data
public class Post {
  private Long id;
  private String title;
  private String slug;
  private String description;
  private String contentMd;
  private String coverUrl;
  private Long categoryId;
  private String categoryName;
  private String authorName;
  private String status;
  private Boolean featured;
  private Integer viewCount;
  private Integer likeCount;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime publishedAt;
  private String tagsText;
  private List<String> tags;
}
