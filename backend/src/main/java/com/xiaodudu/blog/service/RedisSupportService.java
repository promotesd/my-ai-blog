package com.xiaodudu.blog.service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisSupportService {
  private final StringRedisTemplate redisTemplate;
  private final Map<String, Long> localRateLimits = new ConcurrentHashMap<>();

  public RedisSupportService(StringRedisTemplate redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  public String get(String key) {
    try {
      return redisTemplate.opsForValue().get(key);
    } catch (RuntimeException ignored) {
      return null;
    }
  }

  public void put(String key, String value, Duration duration) {
    try {
      redisTemplate.opsForValue().set(key, value, duration);
    } catch (RuntimeException ignored) {
      // The public API remains usable during a local Redis outage.
    }
  }

  public void evictPrefix(String prefix) {
    try {
      var keys = redisTemplate.keys(prefix + "*");
      if (keys != null && !keys.isEmpty()) {
        redisTemplate.delete(keys);
      }
    } catch (RuntimeException ignored) {
      // Cache invalidation is best-effort.
    }
  }

  public void requireRateLimit(String key, Duration duration) {
    try {
      Boolean accepted = redisTemplate.opsForValue().setIfAbsent(key, "1", duration);
      if (Boolean.FALSE.equals(accepted)) {
        throw new RuntimeException("操作太频繁，请稍后再试");
      }
      return;
    } catch (RuntimeException exception) {
      if ("操作太频繁，请稍后再试".equals(exception.getMessage())) {
        throw exception;
      }
    }

    long expiresAt = System.currentTimeMillis() + duration.toMillis();
    Long previous = localRateLimits.putIfAbsent(key, expiresAt);
    if (previous != null && previous > System.currentTimeMillis()) {
      throw new RuntimeException("操作太频繁，请稍后再试");
    }
    localRateLimits.put(key, expiresAt);
  }
}
