package com.xiaodudu.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentRequest {
  private Long postId;
  private String targetType;
  private Long targetId;
  private String nickname;
  private String email;

  @NotBlank
  private String content;
}
