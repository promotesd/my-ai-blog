package com.xiaodudu.blog.service.impl;

import com.xiaodudu.blog.dto.CommentRequest;
import com.xiaodudu.blog.entity.Comment;
import com.xiaodudu.blog.mapper.CommentMapper;
import com.xiaodudu.blog.service.CommentService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CommentServiceImpl implements CommentService {
  private final CommentMapper commentMapper;

  public CommentServiceImpl(CommentMapper commentMapper) {
    this.commentMapper = commentMapper;
  }

  @Override
  public List<Comment> list(String targetType, Long targetId) {
    return commentMapper.findApproved(normalizeType(targetType), targetId);
  }

  @Override
  public Comment create(CommentRequest request) {
    Comment comment = new Comment();
    String targetType = normalizeType(request.getTargetType());
    Long targetId = request.getTargetId() != null ? request.getTargetId() : request.getPostId();
    comment.setTargetType(targetType);
    comment.setTargetId(targetId);
    comment.setPostId("post".equals(targetType) ? targetId : null);
    comment.setNickname(request.getNickname() == null || request.getNickname().isBlank() ? "匿名访客" : request.getNickname());
    comment.setEmail(request.getEmail());
    comment.setContent(request.getContent());
    comment.setStatus("approved");
    commentMapper.insert(comment);
    return comment;
  }

  private String normalizeType(String targetType) {
    return targetType == null || targetType.isBlank() ? "post" : targetType;
  }
}
