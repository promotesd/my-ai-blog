package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.dto.PostRequest;
import com.xiaodudu.blog.entity.Post;
import com.xiaodudu.blog.service.PostService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {
  private final PostService postService;

  public PostController(PostService postService) {
    this.postService = postService;
  }

  @GetMapping
  public Result<List<Post>> list() {
    return Result.success(postService.listPublished());
  }

  @GetMapping("/{slug}")
  public Result<Post> detail(@PathVariable String slug) {
    return Result.success(postService.getBySlug(slug));
  }

  @GetMapping("/admin")
  public Result<List<Post>> adminList() {
    return Result.success(postService.listAdmin());
  }

  @GetMapping("/admin/{id}")
  public Result<Post> adminDetail(@PathVariable Long id) {
    return Result.success(postService.getById(id));
  }

  @PostMapping("/admin")
  public Result<Post> create(@Valid @RequestBody PostRequest request) {
    return Result.success(postService.create(request));
  }

  @PutMapping("/admin/{id}")
  public Result<Post> update(@PathVariable Long id, @Valid @RequestBody PostRequest request) {
    return Result.success(postService.update(id, request));
  }

  @DeleteMapping("/admin/{id}")
  public Result<Void> delete(@PathVariable Long id) {
    postService.delete(id);
    return Result.success(null);
  }
}
