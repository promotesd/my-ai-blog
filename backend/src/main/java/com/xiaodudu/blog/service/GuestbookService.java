package com.xiaodudu.blog.service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

@Service
public class GuestbookService {
  private final JdbcClient jdbcClient;
  private final RedisSupportService redis;

  public GuestbookService(JdbcClient jdbcClient, RedisSupportService redis) {
    this.jdbcClient = jdbcClient;
    this.redis = redis;
  }

  public List<Map<String, Object>> list() {
    return jdbcClient.sql("""
        SELECT id, name, message, avatar_url, created_at
        FROM guestbook
        WHERE visible = 1
        ORDER BY created_at DESC, id DESC
        """).query().listOfRows();
  }

  public List<Map<String, Object>> adminList() {
    return jdbcClient.sql("SELECT * FROM guestbook ORDER BY created_at DESC, id DESC").query().listOfRows();
  }

  public Map<String, Object> adminSave(Long id, Map<String, Object> body) {
    if (id == null) {
      jdbcClient.sql("""
          INSERT INTO guestbook (name, message, avatar_url, fingerprint, ip_address, visible)
          VALUES (:name, :message, :avatarUrl, :fingerprint, :ipAddress, :visible)
          """)
          .param("name", text(body.get("name")))
          .param("message", text(body.get("message")))
          .param("avatarUrl", text(body.get("avatar_url")))
          .param("fingerprint", text(body.getOrDefault("fingerprint", "admin-" + System.nanoTime())))
          .param("ipAddress", text(body.get("ip_address")))
          .param("visible", visible(body))
          .update();
      id = jdbcClient.sql("SELECT LAST_INSERT_ID()").query(Long.class).single();
    } else {
      jdbcClient.sql("""
          UPDATE guestbook
          SET name=:name, message=:message, avatar_url=:avatarUrl, visible=:visible
          WHERE id=:id
          """)
          .param("name", text(body.get("name")))
          .param("message", text(body.get("message")))
          .param("avatarUrl", text(body.get("avatar_url")))
          .param("visible", visible(body))
          .param("id", id)
          .update();
    }
    return jdbcClient.sql("SELECT * FROM guestbook WHERE id=:id").param("id", id).query().singleRow();
  }

  public void delete(Long id) {
    jdbcClient.sql("DELETE FROM guestbook WHERE id=:id").param("id", id).update();
  }

  public void deleteBatch(List<Long> ids) {
    ids.forEach(this::delete);
  }

  public Map<String, Object> setVisibility(Long id, boolean visible) {
    jdbcClient.sql("UPDATE guestbook SET visible=:visible WHERE id=:id")
        .param("visible", visible)
        .param("id", id)
        .update();
    return jdbcClient.sql("SELECT * FROM guestbook WHERE id=:id").param("id", id).query().singleRow();
  }

  public Map<String, Object> create(Map<String, Object> body, String ipAddress) {
    String fingerprint = text(body.getOrDefault("fingerprint", body.get("browser_fingerprint")));
    String name = text(body.get("name"));
    String message = text(body.get("message"));
    if (fingerprint.isBlank() || name.isBlank() || message.isBlank()) {
      throw new RuntimeException("姓名、留言和浏览器 fingerprint 不能为空");
    }
    redis.requireRateLimit("rate:guestbook:" + ipAddress + ":" + fingerprint, Duration.ofMinutes(1));
    Integer count = jdbcClient.sql("SELECT COUNT(*) FROM guestbook WHERE fingerprint=:fingerprint")
        .param("fingerprint", fingerprint)
        .query(Integer.class)
        .single();
    if (count != null && count > 0) {
      throw new RuntimeException("您已经提交过留言");
    }
    jdbcClient.sql("""
        INSERT INTO guestbook (name, message, avatar_url, fingerprint, ip_address, visible)
        VALUES (:name, :message, :avatarUrl, :fingerprint, :ipAddress, 1)
        """)
        .param("name", name)
        .param("message", message)
        .param("avatarUrl", text(body.get("avatar_url")))
        .param("fingerprint", fingerprint)
        .param("ipAddress", ipAddress)
        .update();
    Long id = jdbcClient.sql("SELECT LAST_INSERT_ID()").query(Long.class).single();
    return jdbcClient.sql("SELECT id, name, message, avatar_url, created_at FROM guestbook WHERE id=:id")
        .param("id", id)
        .query()
        .singleRow();
  }

  private String text(Object value) {
    return value == null ? "" : String.valueOf(value).trim();
  }

  private boolean visible(Map<String, Object> body) {
    return !"0".equals(String.valueOf(body.getOrDefault("visible", true)));
  }
}
