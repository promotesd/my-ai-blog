package com.xiaodudu.blog.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class ResumeSection {
  private Long id;
  private String sectionKey;
  private String title;
  private String contentJson;
  private Integer sortOrder;
  private Boolean visible;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
