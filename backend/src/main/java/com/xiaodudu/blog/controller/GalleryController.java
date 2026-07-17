package com.xiaodudu.blog.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.service.RedisSupportService;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gallery")
public class GalleryController {
  private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {};

  private final JdbcTemplate jdbcTemplate;
  private final JdbcClient jdbcClient;
  private final ObjectMapper objectMapper;

  public GalleryController(JdbcTemplate jdbcTemplate, JdbcClient jdbcClient, ObjectMapper objectMapper, RedisSupportService redis) {
    this.jdbcTemplate = jdbcTemplate;
    this.jdbcClient = jdbcClient;
    this.objectMapper = objectMapper;
  }

  @PostConstruct
  public void ensureTables() {
    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS gallery_guest (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(120) NOT NULL,
          avatar_url VARCHAR(1000),
          fingerprint VARCHAR(128) UNIQUE,
          album_count INT DEFAULT 0,
          photo_count INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """);
    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS gallery_album (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          slug VARCHAR(220) NOT NULL UNIQUE,
          name VARCHAR(220) NOT NULL,
          description TEXT,
          category VARCHAR(120) NOT NULL,
          cover_url VARCHAR(1000),
          period VARCHAR(120),
          photo_count INT DEFAULT 0,
          owner_type VARCHAR(20) DEFAULT 'guest',
          guest_id BIGINT,
          guest_name VARCHAR(120),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """);
    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS gallery_photo (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(220) NOT NULL,
          description TEXT,
          location VARCHAR(220),
          date DATE,
          year INT,
          category VARCHAR(120),
          album VARCHAR(220),
          album_slug VARCHAR(220),
          device VARCHAR(120),
          image_url VARCHAR(1000) NOT NULL,
          thumbnail_url VARCHAR(1000),
          width INT DEFAULT 1200,
          height INT DEFAULT 800,
          is_featured TINYINT DEFAULT 0,
          is_approved TINYINT DEFAULT 1,
          tags JSON,
          owner_type VARCHAR(20) DEFAULT 'guest',
          uploader_name VARCHAR(120),
          guest_id BIGINT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """);
  }

  @GetMapping("/photos")
  public Result<List<Map<String, Object>>> photos() {
    List<Map<String, Object>> rows = jdbcClient.sql("SELECT * FROM gallery_photo WHERE is_approved = 1 ORDER BY date DESC, id DESC")
        .query()
        .listOfRows()
        .stream()
        .map(this::normalizePhoto)
        .toList();
    return Result.success(rows);
  }

  @GetMapping("/albums")
  public Result<List<Map<String, Object>>> albums() {
    List<Map<String, Object>> rows = jdbcClient.sql("SELECT * FROM gallery_album WHERE photo_count > 0 ORDER BY created_at DESC, id DESC")
        .query()
        .listOfRows()
        .stream()
        .map(this::normalizeAlbum)
        .toList();
    return Result.success(rows);
  }

  @GetMapping("/guests")
  public Result<List<Map<String, Object>>> guests() {
    List<Map<String, Object>> rows = jdbcClient.sql("SELECT * FROM gallery_guest WHERE photo_count > 0 ORDER BY name ASC, id ASC")
        .query()
        .listOfRows()
        .stream()
        .map(this::normalizeGuest)
        .toList();
    return Result.success(rows);
  }

  @GetMapping("/guest/check")
  public Map<String, Object> checkGuest(
      @RequestParam(value = "id", required = false) Long id,
      @RequestParam(value = "fp", required = false) String fingerprint
  ) {
    List<Map<String, Object>> rows;
    if (id != null) {
      rows = jdbcClient.sql("SELECT * FROM gallery_guest WHERE id=:id LIMIT 1")
          .param("id", id)
          .query()
          .listOfRows();
    } else if (fingerprint != null && !fingerprint.isBlank()) {
      rows = jdbcClient.sql("SELECT * FROM gallery_guest WHERE fingerprint=:fingerprint LIMIT 1")
          .param("fingerprint", fingerprint)
          .query()
          .listOfRows();
    } else {
      rows = List.of();
    }
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("guest", rows.stream().findFirst().map(this::toGuest).orElse(null));
    return response;
  }

  @PostMapping("/guest/register")
  public Map<String, Object> registerGuest(@RequestBody Map<String, Object> body, HttpServletRequest request) {
    String name = Objects.toString(body.getOrDefault("name", ""), "").trim();
    String fingerprint = Objects.toString(body.getOrDefault("fingerprint", ""), "").trim();
    String avatarUrl = blankToNull(body.get("avatarUrl"));
    if (name.isBlank()) {
      throw new RuntimeException("Name is required");
    }
    if (fingerprint.isBlank()) {
      fingerprint = clientIp(request) + ":" + name.toLowerCase(Locale.ROOT);
    }

    List<Map<String, Object>> existing = jdbcClient.sql("SELECT * FROM gallery_guest WHERE fingerprint=:fingerprint LIMIT 1")
        .param("fingerprint", fingerprint)
        .query()
        .listOfRows();
    if (!existing.isEmpty()) {
      return Map.of("guest", toGuest(existing.get(0)));
    }

    jdbcClient.sql("INSERT INTO gallery_guest (name, avatar_url, fingerprint) VALUES (:name, :avatarUrl, :fingerprint)")
        .param("name", name)
        .param("avatarUrl", avatarUrl)
        .param("fingerprint", fingerprint)
        .update();
    Long id = jdbcClient.sql("SELECT LAST_INSERT_ID()").query(Long.class).single();
    return Map.of("guest", toGuest(findGuest(id)));
  }

  @PostMapping("/guest/album")
  public Map<String, Object> createAlbum(@RequestBody Map<String, Object> body) {
    Long guestId = number(body.get("guestId")).longValue();
    String guestName = Objects.toString(body.getOrDefault("guestName", ""), "");
    String name = Objects.toString(body.getOrDefault("name", ""), "").trim();
    String category = Objects.toString(body.getOrDefault("category", "Aktivitas & Daily Life"), "Aktivitas & Daily Life");
    String description = Objects.toString(body.getOrDefault("description", ""), "");
    if (guestId <= 0 || name.isBlank()) {
      throw new RuntimeException("Guest and album name are required");
    }

    String baseSlug = slugify(name);
    String slug = uniqueAlbumSlug(baseSlug.isBlank() ? "guest-album" : baseSlug);
    jdbcClient.sql("""
            INSERT INTO gallery_album (slug, name, description, category, cover_url, period, owner_type, guest_id, guest_name)
            VALUES (:slug, :name, :description, :category, '', :period, 'guest', :guestId, :guestName)
            """)
        .param("slug", slug)
        .param("name", name)
        .param("description", description)
        .param("category", category)
        .param("period", String.valueOf(LocalDate.now().getYear()))
        .param("guestId", guestId)
        .param("guestName", guestName)
        .update();
    updateGuestCounts(guestId);
    return Map.of("album", toAlbum(findAlbum(slug)));
  }

  @PostMapping("/guest/photo")
  public Map<String, Object> savePhotos(@RequestBody Map<String, Object> body) throws Exception {
    Long guestId = number(body.get("guestId")).longValue();
    String guestName = Objects.toString(body.getOrDefault("guestName", ""), "");
    String albumSlug = Objects.toString(body.getOrDefault("albumSlug", ""), "");
    String albumName = Objects.toString(body.getOrDefault("albumName", ""), "");
    String albumCategory = Objects.toString(body.getOrDefault("albumCategory", "Aktivitas & Daily Life"), "Aktivitas & Daily Life");
    List<Map<String, Object>> photos = (List<Map<String, Object>>) body.getOrDefault("photos", List.of());
    if (guestId <= 0 || albumSlug.isBlank() || photos.isEmpty()) {
      throw new RuntimeException("Photo payload is incomplete");
    }

    List<Map<String, Object>> saved = new ArrayList<>();
    for (Map<String, Object> photo : photos) {
      String title = Objects.toString(photo.getOrDefault("title", ""), "").trim();
      String imageUrl = Objects.toString(photo.getOrDefault("imageUrl", ""), "");
      if (title.isBlank() || imageUrl.isBlank()) {
        continue;
      }
      LocalDate date = parseDate(Objects.toString(photo.getOrDefault("date", LocalDate.now().toString()), LocalDate.now().toString()));
      String tags = objectMapper.writeValueAsString(photo.getOrDefault("tags", List.of()));
      jdbcClient.sql("""
              INSERT INTO gallery_photo
                (title, description, location, date, year, category, album, album_slug, device,
                 image_url, thumbnail_url, width, height, is_featured, is_approved, tags,
                 owner_type, uploader_name, guest_id)
              VALUES
                (:title, :description, :location, :date, :year, :category, :album, :albumSlug, 'Guest Upload',
                 :imageUrl, :thumbnailUrl, :width, :height, 0, 1, CAST(:tags AS JSON),
                 'guest', :uploaderName, :guestId)
              """)
          .param("title", title)
          .param("description", Objects.toString(photo.getOrDefault("description", ""), ""))
          .param("location", Objects.toString(photo.getOrDefault("location", ""), ""))
          .param("date", date)
          .param("year", date.getYear())
          .param("category", albumCategory)
          .param("album", albumName)
          .param("albumSlug", albumSlug)
          .param("imageUrl", imageUrl)
          .param("thumbnailUrl", Objects.toString(photo.getOrDefault("thumbnailUrl", imageUrl), imageUrl))
          .param("width", number(photo.getOrDefault("width", 1200)))
          .param("height", number(photo.getOrDefault("height", 800)))
          .param("tags", tags)
          .param("uploaderName", guestName)
          .param("guestId", guestId)
          .update();
      Long id = jdbcClient.sql("SELECT LAST_INSERT_ID()").query(Long.class).single();
      saved.add(normalizePhoto(findPhoto(id)));
    }

    if (!saved.isEmpty()) {
      Map<String, Object> first = saved.get(0);
      jdbcClient.sql("""
              UPDATE gallery_album
              SET cover_url = IF(cover_url IS NULL OR cover_url = '', :coverUrl, cover_url),
                  photo_count = (SELECT COUNT(*) FROM gallery_photo WHERE album_slug=:albumSlug)
              WHERE slug=:albumSlug
              """)
          .param("coverUrl", first.get("image_url"))
          .param("albumSlug", albumSlug)
          .update();
      updateGuestCounts(guestId);
    }

    return Map.of("photos", saved, "count", saved.size());
  }

  private Map<String, Object> findGuest(Long id) {
    return jdbcClient.sql("SELECT * FROM gallery_guest WHERE id=:id LIMIT 1")
        .param("id", id)
        .query()
        .listOfRows()
        .stream()
        .findFirst()
        .orElseThrow(() -> new RuntimeException("Guest not found"));
  }

  private Map<String, Object> findAlbum(String slug) {
    return jdbcClient.sql("SELECT * FROM gallery_album WHERE slug=:slug LIMIT 1")
        .param("slug", slug)
        .query()
        .listOfRows()
        .stream()
        .findFirst()
        .orElseThrow(() -> new RuntimeException("Album not found"));
  }

  private Map<String, Object> findPhoto(Long id) {
    return jdbcClient.sql("SELECT * FROM gallery_photo WHERE id=:id LIMIT 1")
        .param("id", id)
        .query()
        .listOfRows()
        .stream()
        .findFirst()
        .orElseThrow(() -> new RuntimeException("Photo not found"));
  }

  private void updateGuestCounts(Long guestId) {
    jdbcClient.sql("""
            UPDATE gallery_guest
            SET album_count = (SELECT COUNT(*) FROM gallery_album WHERE guest_id=:guestId),
                photo_count = (SELECT COUNT(*) FROM gallery_photo WHERE guest_id=:guestId)
            WHERE id=:guestId
            """)
        .param("guestId", guestId)
        .update();
  }

  private String uniqueAlbumSlug(String baseSlug) {
    String candidate = baseSlug;
    int suffix = 2;
    while (jdbcClient.sql("SELECT COUNT(*) FROM gallery_album WHERE slug=:slug")
        .param("slug", candidate)
        .query(Integer.class)
        .single() > 0) {
      candidate = baseSlug + "-" + suffix++;
    }
    return candidate;
  }

  private Map<String, Object> normalizeGuest(Map<String, Object> row) {
    Map<String, Object> guest = toGuest(row);
    guest.put("avatar_url", guest.get("avatarUrl"));
    guest.put("album_count", guest.get("albumCount"));
    guest.put("photo_count", guest.get("photoCount"));
    guest.put("created_at", guest.get("createdAt"));
    return guest;
  }

  private Map<String, Object> toGuest(Map<String, Object> row) {
    Map<String, Object> guest = new LinkedHashMap<>();
    guest.put("id", row.get("id"));
    guest.put("name", row.get("name"));
    guest.put("avatarUrl", row.get("avatar_url"));
    guest.put("albumCount", number(row.get("album_count")));
    guest.put("photoCount", number(row.get("photo_count")));
    guest.put("createdAt", stringDate(row.get("created_at")));
    return guest;
  }

  private Map<String, Object> normalizeAlbum(Map<String, Object> row) {
    return toAlbum(row);
  }

  private Map<String, Object> toAlbum(Map<String, Object> row) {
    Map<String, Object> album = new LinkedHashMap<>();
    album.put("slug", row.get("slug"));
    album.put("name", row.get("name"));
    album.put("description", row.get("description"));
    album.put("category", row.get("category"));
    album.put("cover_url", row.get("cover_url"));
    album.put("period", row.get("period"));
    album.put("photo_count", number(row.get("photo_count")));
    album.put("owner_type", row.get("owner_type"));
    album.put("guest_id", row.get("guest_id"));
    return album;
  }

  private Map<String, Object> normalizePhoto(Map<String, Object> row) {
    Map<String, Object> photo = new LinkedHashMap<>(row);
    photo.put("is_featured", booleanValue(row.get("is_featured")));
    photo.put("is_approved", booleanValue(row.get("is_approved")));
    photo.put("tags", parseTags(row.get("tags")));
    photo.put("date", stringDate(row.get("date")));
    return photo;
  }

  private List<String> parseTags(Object value) {
    if (value == null) return List.of();
    if (value instanceof List<?> list) return list.stream().map(String::valueOf).toList();
    try {
      return objectMapper.readValue(String.valueOf(value), STRING_LIST);
    } catch (Exception ignored) {
      return List.of();
    }
  }

  private Number number(Object value) {
    return value instanceof Number number ? number : 0;
  }

  private boolean booleanValue(Object value) {
    return value instanceof Boolean bool ? bool : "1".equals(String.valueOf(value)) || "true".equalsIgnoreCase(String.valueOf(value));
  }

  private String blankToNull(Object value) {
    String text = Objects.toString(value, "").trim();
    return text.isBlank() ? null : text;
  }

  private LocalDate parseDate(String value) {
    try {
      return LocalDate.parse(value);
    } catch (Exception ignored) {
      return LocalDate.now();
    }
  }

  private String stringDate(Object value) {
    if (value == null) return null;
    if (value instanceof LocalDate date) return date.toString();
    if (value instanceof LocalDateTime dateTime) return dateTime.toString();
    return String.valueOf(value);
  }

  private String slugify(String value) {
    String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("(^-|-$)", "");
    return normalized.length() > 180 ? normalized.substring(0, 180) : normalized;
  }

  private String clientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
  }
}
