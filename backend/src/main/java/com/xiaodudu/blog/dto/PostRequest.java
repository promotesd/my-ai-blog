package com.xiaodudu.blog.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;

@Data
public class PostRequest {
  @NotBlank
  private String title;

  @NotBlank
  private String slug;

  private String description;

  @NotBlank
  private String contentMd;

  private String coverUrl;
  private Long categoryId;
  private String authorName;
  private String status;
  private Boolean featured;
  private List<Long> tagIds;
}
