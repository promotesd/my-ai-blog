package com.xiaodudu.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProjectRequest {
  @NotBlank
  private String title;
  @NotBlank
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
}
