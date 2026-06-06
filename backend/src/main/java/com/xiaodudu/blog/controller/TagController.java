package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.dto.TagRequest;
import com.xiaodudu.blog.entity.Tag;
import com.xiaodudu.blog.mapper.TagMapper;
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
@RequestMapping("/api/tags")
public class TagController {
  private final TagMapper tagMapper;

  public TagController(TagMapper tagMapper) {
    this.tagMapper = tagMapper;
  }

  @GetMapping
  public Result<List<Tag>> list() {
    return Result.success(tagMapper.findAll());
  }

  @PostMapping("/admin")
  public Result<Tag> create(@Valid @RequestBody TagRequest request) {
    Tag tag = new Tag();
    tag.setName(request.getName());
    tag.setSlug(request.getSlug());
    tagMapper.insert(tag);
    return Result.success(tag);
  }

  @PutMapping("/admin/{id}")
  public Result<Tag> update(@PathVariable Long id, @Valid @RequestBody TagRequest request) {
    Tag tag = new Tag();
    tag.setId(id);
    tag.setName(request.getName());
    tag.setSlug(request.getSlug());
    tagMapper.update(tag);
    return Result.success(tagMapper.findById(id));
  }

  @DeleteMapping("/admin/{id}")
  public Result<Void> delete(@PathVariable Long id) {
    tagMapper.deleteById(id);
    return Result.success(null);
  }
}
