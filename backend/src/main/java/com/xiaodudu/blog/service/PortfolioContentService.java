package com.xiaodudu.blog.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

@Service
public class PortfolioContentService {
  private static final Duration CACHE_TTL = Duration.ofMinutes(10);
  private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

  private final JdbcClient jdbcClient;
  private final ObjectMapper objectMapper;
  private final RedisSupportService redis;

  public PortfolioContentService(JdbcClient jdbcClient, ObjectMapper objectMapper, RedisSupportService redis) {
    this.jdbcClient = jdbcClient;
    this.objectMapper = objectMapper;
    this.redis = redis;
  }

  public List<Map<String, Object>> list(String resourcePath, boolean includeHidden) {
    PortfolioResource resource = PortfolioResource.fromPath(resourcePath);
    String cacheKey = "portfolio:" + resource.path() + ":list";
    if (!includeHidden) {
      List<Map<String, Object>> cached = readCachedList(cacheKey);
      if (cached != null) {
        return cached;
      }
    }
    String where = includeHidden ? "" : " WHERE visible = 1";
    List<Map<String, Object>> rows = jdbcClient.sql("SELECT * FROM " + resource.table() + where
            + " ORDER BY sort_order ASC, updated_at DESC, id DESC")
        .query()
        .listOfRows()
        .stream()
        .map(this::expandPayload)
        .toList();
    if (!includeHidden) {
      writeCache(cacheKey, rows);
    }
    return rows;
  }

  public Map<String, Object> findBySlug(String resourcePath, String slug) {
    PortfolioResource resource = PortfolioResource.fromPath(resourcePath);
    if (!resource.slugSupported()) {
      throw new RuntimeException("该资源不支持 slug 详情");
    }
    String cacheKey = "portfolio:" + resource.path() + ":slug:" + slug;
    Map<String, Object> cached = readCachedMap(cacheKey);
    if (cached != null) {
      return cached;
    }
    Map<String, Object> row = jdbcClient.sql("SELECT * FROM " + resource.table()
            + " WHERE slug = :slug AND visible = 1 LIMIT 1")
        .param("slug", slug)
        .query()
        .listOfRows()
        .stream()
        .findFirst()
        .map(this::expandPayload)
        .orElseThrow(() -> new RuntimeException("内容不存在"));
    writeCache(cacheKey, row);
    return row;
  }

  public Map<String, Object> save(String resourcePath, Long id, Map<String, Object> body) {
    PortfolioResource resource = PortfolioResource.fromPath(resourcePath);
    Map<String, Object> values = baseValues(body);
    String payload = payload(body);
    if (id == null) {
      jdbcClient.sql("INSERT INTO " + resource.table()
              + " (slug, title, payload, status, sort_order, visible) "
              + "VALUES (:slug, :title, :payload, :status, :sortOrder, :visible)")
          .params(values)
          .param("payload", payload)
          .update();
      id = jdbcClient.sql("SELECT LAST_INSERT_ID()").query(Long.class).single();
    } else {
      jdbcClient.sql("UPDATE " + resource.table()
              + " SET slug=:slug, title=:title, payload=:payload, status=:status, "
              + "sort_order=:sortOrder, visible=:visible WHERE id=:id")
          .params(values)
          .param("payload", payload)
          .param("id", id)
          .update();
    }
    evict(resource);
    return findById(resource, id);
  }

  public void delete(String resourcePath, Long id) {
    PortfolioResource resource = PortfolioResource.fromPath(resourcePath);
    jdbcClient.sql("DELETE FROM " + resource.table() + " WHERE id=:id").param("id", id).update();
    evict(resource);
  }

  public void deleteBatch(String resourcePath, List<Long> ids) {
    PortfolioResource resource = PortfolioResource.fromPath(resourcePath);
    ids.forEach(id -> jdbcClient.sql("DELETE FROM " + resource.table() + " WHERE id=:id")
        .param("id", id)
        .update());
    evict(resource);
  }

  public Map<String, Object> setVisibility(String resourcePath, Long id, boolean visible) {
    PortfolioResource resource = PortfolioResource.fromPath(resourcePath);
    jdbcClient.sql("UPDATE " + resource.table() + " SET visible=:visible WHERE id=:id")
        .param("visible", visible)
        .param("id", id)
        .update();
    evict(resource);
    return findById(resource, id);
  }

  private Map<String, Object> findById(PortfolioResource resource, Long id) {
    return jdbcClient.sql("SELECT * FROM " + resource.table() + " WHERE id=:id LIMIT 1")
        .param("id", id)
        .query()
        .listOfRows()
        .stream()
        .findFirst()
        .map(this::expandPayload)
        .orElseThrow(() -> new RuntimeException("内容不存在"));
  }

  private Map<String, Object> baseValues(Map<String, Object> body) {
    return Map.of(
        "slug", Objects.toString(body.getOrDefault("slug", ""), ""),
        "title", Objects.toString(body.getOrDefault("title", ""), ""),
        "status", Objects.toString(body.getOrDefault("status", "published"), "published"),
        "sortOrder", number(body.get("sort_order")),
        "visible", booleanValue(body.getOrDefault("visible", true))
    );
  }

  private String payload(Map<String, Object> body) {
    Map<String, Object> payload = new LinkedHashMap<>(body);
    List.of("id", "slug", "title", "status", "sort_order", "visible", "created_at", "updated_at")
        .forEach(payload::remove);
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (Exception exception) {
      throw new RuntimeException("JSON 数据格式错误");
    }
  }

  private Map<String, Object> expandPayload(Map<String, Object> source) {
    Map<String, Object> result = new LinkedHashMap<>();
    Object payload = source.get("payload");
    if (payload != null && !String.valueOf(payload).isBlank()) {
      try {
        result.putAll(objectMapper.readValue(String.valueOf(payload), MAP_TYPE));
      } catch (Exception ignored) {
        result.put("payload", payload);
      }
    }
    source.forEach((key, value) -> {
      if (!"payload".equals(key)) {
        result.put(key, value);
      }
    });
    return result;
  }

  private int number(Object value) {
    return value instanceof Number number ? number.intValue() : 0;
  }

  private boolean booleanValue(Object value) {
    return value instanceof Boolean bool ? bool : !"0".equals(String.valueOf(value));
  }

  private void evict(PortfolioResource resource) {
    redis.evictPrefix("portfolio:" + resource.path() + ":");
  }

  private void writeCache(String key, Object value) {
    try {
      redis.put(key, objectMapper.writeValueAsString(value), CACHE_TTL);
    } catch (Exception ignored) {
      // Caching must never prevent content delivery.
    }
  }

  private List<Map<String, Object>> readCachedList(String key) {
    String value = redis.get(key);
    if (value == null) return null;
    try {
      return objectMapper.readValue(value, new TypeReference<ArrayList<Map<String, Object>>>() {});
    } catch (Exception ignored) {
      return null;
    }
  }

  private Map<String, Object> readCachedMap(String key) {
    String value = redis.get(key);
    if (value == null) return null;
    try {
      return objectMapper.readValue(value, MAP_TYPE);
    } catch (Exception ignored) {
      return null;
    }
  }
}
