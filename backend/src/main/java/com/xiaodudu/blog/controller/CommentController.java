package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.dto.CommentRequest;
import com.xiaodudu.blog.entity.Comment;
import com.xiaodudu.blog.mapper.CommentMapper;
import com.xiaodudu.blog.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
  private final CommentService commentService;
  private final CommentMapper commentMapper;

  public CommentController(CommentService commentService, CommentMapper commentMapper) {
    this.commentService = commentService;
    this.commentMapper = commentMapper;
  }

  @GetMapping
  public Result<List<Comment>> list(@RequestParam String targetType, @RequestParam Long targetId) {
    return Result.success(commentService.list(targetType, targetId));
  }

  @PostMapping
  public Result<Comment> create(@Valid @RequestBody CommentRequest request) {
    return Result.success(commentService.create(request));
  }

  @GetMapping("/admin")
  public Result<List<Comment>> adminList() {
    return Result.success(commentMapper.findAll());
  }

  @PutMapping("/admin/{id}/{status}")
  public Result<Void> status(@PathVariable Long id, @PathVariable String status) {
    commentMapper.updateStatus(id, status);
    return Result.success(null);
  }

  @DeleteMapping("/admin/{id}")
  public Result<Void> delete(@PathVariable Long id) {
    commentMapper.deleteById(id);
    return Result.success(null);
  }
}
