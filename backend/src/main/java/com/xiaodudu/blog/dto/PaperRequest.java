package com.xiaodudu.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaperRequest {
  @NotBlank
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
}
