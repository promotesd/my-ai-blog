package com.xiaodudu.blog.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Paper {
  private Long id;
  private String title;
  private String authors;
  private String venue;
  private Integer year;
  private String status;
  private String abstractText;
  private String tags;
  private String pdfUrl;
  private String codeUrl;
  private String projectUrl;
  private String datasetUrl;
  private Boolean featured;
  private Integer likeCount;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
