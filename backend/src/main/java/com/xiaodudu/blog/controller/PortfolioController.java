package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.service.PortfolioContentService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PortfolioController {
  private final PortfolioContentService contentService;

  public PortfolioController(PortfolioContentService contentService) {
    this.contentService = contentService;
  }

  @GetMapping("/{resource:blogs|projects|skills|certificates|timelines|work-experiences|coding-journey|tech-tools|deployed-projects|diaries|portfolio-stats}")
  public Result<List<Map<String, Object>>> list(@PathVariable String resource) {
    return Result.success(contentService.list(resource, false));
  }

  @GetMapping("/{resource:blogs|projects|certificates|timelines|deployed-projects|diaries}/{slug}")
  public Result<Map<String, Object>> detail(@PathVariable String resource, @PathVariable String slug) {
    return Result.success(contentService.findBySlug(resource, slug));
  }
}
