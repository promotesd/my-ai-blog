package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.dto.CategoryRequest;
import com.xiaodudu.blog.entity.Category;
import com.xiaodudu.blog.mapper.CategoryMapper;
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
@RequestMapping("/api/categories")
public class CategoryController {
  private final CategoryMapper categoryMapper;

  public CategoryController(CategoryMapper categoryMapper) {
    this.categoryMapper = categoryMapper;
  }

  @GetMapping
  public Result<List<Category>> list() {
    return Result.success(categoryMapper.findAll());
  }

  @PostMapping("/admin")
  public Result<Category> create(@Valid @RequestBody CategoryRequest request) {
    Category category = new Category();
    category.setName(request.getName());
    category.setSlug(request.getSlug());
    category.setDescription(request.getDescription());
    categoryMapper.insert(category);
    return Result.success(category);
  }

  @PutMapping("/admin/{id}")
  public Result<Category> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
    Category category = new Category();
    category.setId(id);
    category.setName(request.getName());
    category.setSlug(request.getSlug());
    category.setDescription(request.getDescription());
    categoryMapper.update(category);
    return Result.success(categoryMapper.findById(id));
  }

  @DeleteMapping("/admin/{id}")
  public Result<Void> delete(@PathVariable Long id) {
    categoryMapper.deleteById(id);
    return Result.success(null);
  }
}
