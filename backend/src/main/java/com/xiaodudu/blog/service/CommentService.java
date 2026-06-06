package com.xiaodudu.blog.service;

import com.xiaodudu.blog.dto.CommentRequest;
import com.xiaodudu.blog.entity.Comment;
import java.util.List;

public interface CommentService {
  List<Comment> list(String targetType, Long targetId);

  Comment create(CommentRequest request);
}
