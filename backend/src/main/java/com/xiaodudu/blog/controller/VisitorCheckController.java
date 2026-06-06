package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.service.RedisSupportService;
import java.time.Duration;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/visitor-check")
public class VisitorCheckController {
  private final RedisSupportService redis;

  public VisitorCheckController(RedisSupportService redis) {
    this.redis = redis;
  }

  @GetMapping
  public Result<Map<String, Boolean>> check(@RequestParam String type, @RequestParam(name = "fp") String fingerprint) {
    return Result.success(Map.of("checked", redis.get(key(type, fingerprint)) != null));
  }

  @PostMapping
  public Result<Map<String, Boolean>> mark(@RequestBody Map<String, Object> body) {
    String type = text(body.get("type"));
    String fingerprint = text(body.getOrDefault("fingerprint", body.get("fp")));
    if (type.isBlank() || fingerprint.isBlank()) {
      throw new RuntimeException("type 和 fingerprint 不能为空");
    }
    redis.put(key(type, fingerprint), "1", Duration.ofDays(365));
    return Result.success(Map.of("checked", true));
  }

  private String key(String type, String fingerprint) {
    return "visitor-check:" + type.replaceAll("[^a-zA-Z0-9_-]", "_") + ":" + fingerprint;
  }

  private String text(Object value) {
    return value == null ? "" : String.valueOf(value).trim();
  }
}
