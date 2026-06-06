package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {
  @GetMapping("/health")
  public Result<Map<String, Object>> health() {
    return Result.success(Map.of("status", "ok", "time", LocalDateTime.now()));
  }
}
