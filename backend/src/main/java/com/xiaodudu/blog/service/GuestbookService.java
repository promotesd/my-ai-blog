package com.xiaodudu.blog.service;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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

  @PostConstruct
  public void ensureColumns() {
    addColumnIfMissing("city", "VARCHAR(120) DEFAULT ''");
    addColumnIfMissing("contact", "VARCHAR(180) DEFAULT ''");
    addColumnIfMissing("profession", "VARCHAR(120) DEFAULT ''");
    addColumnIfMissing("mood", "VARCHAR(60) DEFAULT 'Senang'");
    addColumnIfMissing("rating", "INT DEFAULT 5");
    addColumnIfMissing("card_color", "VARCHAR(20) DEFAULT '#6366f1'");
    addColumnIfMissing("referral_source", "VARCHAR(120) DEFAULT 'xiaodudu.top'");
    addColumnIfMissing("is_approved", "TINYINT DEFAULT 1");
  }

  private void addColumnIfMissing(String columnName, String definition) {
    Integer count = jdbcClient.sql("""
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'guestbook'
          AND COLUMN_NAME = :columnName
        """)
        .param("columnName", columnName)
        .query(Integer.class)
        .single();
    if (count == null || count == 0) {
      jdbcClient.sql("ALTER TABLE guestbook ADD COLUMN " + columnName + " " + definition).update();
    }
  }

  public List<Map<String, Object>> list() {
    return jdbcClient.sql("""
        SELECT id, name, city, contact, profession, message, mood, rating, card_color,
               avatar_url, referral_source, is_approved, created_at
        FROM guestbook
        WHERE visible = 1 AND is_approved = 1
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
    String city = text(body.get("city"));
    String contact = text(body.get("contact"));
    String message = text(body.get("message"));
    if (name.isBlank() || city.isBlank() || contact.isBlank() || message.isBlank()) {
      throw new RuntimeException("名称、地址、联系方式和留言不能为空");
    }
    if (fingerprint.isBlank()) {
      fingerprint = ipAddress + ":" + UUID.randomUUID();
    }
    redis.requireRateLimit("rate:guestbook:" + ipAddress, Duration.ofSeconds(10));
    jdbcClient.sql("""
        INSERT INTO guestbook
          (name, city, contact, profession, message, mood, rating, card_color,
           avatar_url, referral_source, fingerprint, ip_address, visible, is_approved)
        VALUES
          (:name, :city, :contact, :profession, :message, :mood, :rating, :cardColor,
           :avatarUrl, :referralSource, :fingerprint, :ipAddress, 1, 1)
        """)
        .param("name", name)
        .param("city", city)
        .param("contact", contact)
        .param("profession", text(body.getOrDefault("profession", "访客")))
        .param("message", message)
        .param("mood", text(body.getOrDefault("mood", "Senang")))
        .param("rating", number(body.getOrDefault("rating", 5)))
        .param("cardColor", text(body.getOrDefault("card_color", "#6366f1")))
        .param("avatarUrl", text(body.get("avatar_url")))
        .param("referralSource", text(body.getOrDefault("referral_source", "xiaodudu.top")))
        .param("fingerprint", fingerprint)
        .param("ipAddress", ipAddress)
        .update();
    Long id = jdbcClient.sql("SELECT LAST_INSERT_ID()").query(Long.class).single();
    return jdbcClient.sql("""
        SELECT id, name, city, contact, profession, message, mood, rating, card_color,
               avatar_url, referral_source, is_approved, created_at
        FROM guestbook WHERE id=:id
        """)
        .param("id", id)
        .query()
        .singleRow();
  }

  private String text(Object value) {
    return value == null ? "" : String.valueOf(value).trim();
  }

  private int number(Object value) {
    if (value instanceof Number number) {
      return number.intValue();
    }
    try {
      return Integer.parseInt(String.valueOf(value));
    } catch (Exception ignored) {
      return 5;
    }
  }

  private boolean visible(Map<String, Object> body) {
    return !"0".equals(String.valueOf(body.getOrDefault("visible", true)));
  }
}
