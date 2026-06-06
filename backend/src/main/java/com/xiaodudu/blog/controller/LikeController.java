package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.service.LikeService;
import com.xiaodudu.blog.service.RedisSupportService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.time.Duration;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/likes")
public class LikeController {
  private final LikeService likeService;
  private final RedisSupportService redis;

  public LikeController(LikeService likeService, RedisSupportService redis) {
    this.likeService = likeService;
    this.redis = redis;
  }

  @GetMapping
  public Result<Map<String, Integer>> count(@RequestParam String targetType, @RequestParam Long targetId) {
    return Result.success(Map.of("count", likeService.count(targetType, targetId)));
  }

  @PostMapping
  public Result<Map<String, Integer>> like(@RequestParam String targetType, @RequestParam Long targetId, HttpServletRequest request) {
    String clientKey = request.getHeader("X-Client-Key");
    if (clientKey == null || clientKey.isBlank()) {
      clientKey = request.getRemoteAddr() + ":" + request.getHeader("User-Agent");
    }
    redis.requireRateLimit("rate:like:" + targetType + ":" + targetId + ":" + clientKey, Duration.ofSeconds(3));
    return Result.success(Map.of("count", likeService.like(targetType, targetId, clientKey)));
  }
}
