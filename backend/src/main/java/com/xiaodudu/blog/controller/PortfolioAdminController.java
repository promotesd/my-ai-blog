package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.service.PortfolioContentService;
import com.xiaodudu.blog.service.GuestbookService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class PortfolioAdminController {
  private final PortfolioContentService contentService;
  private final GuestbookService guestbookService;

  public PortfolioAdminController(PortfolioContentService contentService, GuestbookService guestbookService) {
    this.contentService = contentService;
    this.guestbookService = guestbookService;
  }

  @GetMapping("/{resource}")
  public Result<List<Map<String, Object>>> list(@PathVariable String resource) {
    if ("guestbook".equals(resource)) return Result.success(guestbookService.adminList());
    return Result.success(contentService.list(resource, true));
  }

  @PostMapping("/{resource}")
  public Result<Map<String, Object>> create(@PathVariable String resource, @RequestBody Map<String, Object> body) {
    if ("guestbook".equals(resource)) return Result.success(guestbookService.adminSave(null, body));
    return Result.success(contentService.save(resource, null, body));
  }

  @PutMapping("/{resource}/{id}")
  public Result<Map<String, Object>> update(@PathVariable String resource, @PathVariable Long id,
      @RequestBody Map<String, Object> body) {
    if ("guestbook".equals(resource)) return Result.success(guestbookService.adminSave(id, body));
    return Result.success(contentService.save(resource, id, body));
  }

  @PatchMapping("/{resource}/{id}/visibility")
  public Result<Map<String, Object>> visibility(@PathVariable String resource, @PathVariable Long id,
      @RequestBody Map<String, Boolean> body) {
    if ("guestbook".equals(resource)) {
      return Result.success(guestbookService.setVisibility(id, Boolean.TRUE.equals(body.get("visible"))));
    }
    return Result.success(contentService.setVisibility(resource, id, Boolean.TRUE.equals(body.get("visible"))));
  }

  @DeleteMapping("/{resource}/{id}")
  public Result<Void> delete(@PathVariable String resource, @PathVariable Long id) {
    if ("guestbook".equals(resource)) {
      guestbookService.delete(id);
      return Result.success(null);
    }
    contentService.delete(resource, id);
    return Result.success(null);
  }

  @DeleteMapping("/{resource}")
  public Result<Void> deleteBatch(@PathVariable String resource, @RequestBody Map<String, List<Long>> body) {
    if ("guestbook".equals(resource)) {
      guestbookService.deleteBatch(body.getOrDefault("ids", List.of()));
      return Result.success(null);
    }
    contentService.deleteBatch(resource, body.getOrDefault("ids", List.of()));
    return Result.success(null);
  }
}
