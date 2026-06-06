package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.service.GuestbookService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/guestbook")
public class GuestbookController {
  private final GuestbookService guestbookService;

  public GuestbookController(GuestbookService guestbookService) {
    this.guestbookService = guestbookService;
  }

  @GetMapping
  public Result<List<Map<String, Object>>> list() {
    return Result.success(guestbookService.list());
  }

  @PostMapping
  public Result<Map<String, Object>> create(@RequestBody Map<String, Object> body, HttpServletRequest request) {
    return Result.success(guestbookService.create(body, clientIp(request)));
  }

  private String clientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
  }
}
