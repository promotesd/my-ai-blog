package com.xiaodudu.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaodudu.blog.common.Result;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/gallery")
public class GalleryAdminController {
  private final JdbcClient jdbcClient;
  private final ObjectMapper objectMapper;

  public GalleryAdminController(JdbcClient jdbcClient, ObjectMapper objectMapper) {
    this.jdbcClient = jdbcClient;
    this.objectMapper = objectMapper;
  }

  @PostMapping("/photos")
  public Result<Map<String, Object>> createPhoto(@RequestBody Map<String, Object> body) throws Exception {
    Long id = savePhoto(null, body);
    return Result.success(find("gallery_photo", "id", id));
  }

  @PutMapping("/photos/{id}")
  public Result<Map<String, Object>> updatePhoto(@PathVariable Long id, @RequestBody Map<String, Object> body) throws Exception {
    savePhoto(id, body);
    return Result.success(find("gallery_photo", "id", id));
  }

  @DeleteMapping("/photos/{id}")
  public Result<Void> deletePhoto(@PathVariable Long id) {
    Map<String, Object> photo = find("gallery_photo", "id", id);
    jdbcClient.sql("DELETE FROM gallery_photo WHERE id=:id").param("id", id).update();
    refreshCounts(number(photo.get("guest_id")).longValue(), Objects.toString(photo.get("album_slug"), ""));
    return Result.success(null);
  }

  @DeleteMapping("/photos")
  public Result<Void> deletePhotos(@RequestBody Map<String, List<Long>> body) {
    for (Long id : body.getOrDefault("ids", List.of())) deletePhoto(id);
    return Result.success(null);
  }

  @PostMapping("/albums")
  public Result<Map<String, Object>> createAlbum(@RequestBody Map<String, Object> body) {
    String slug = saveAlbum(null, body);
    return Result.success(find("gallery_album", "slug", slug));
  }

  @PutMapping("/albums/{slug}")
  public Result<Map<String, Object>> updateAlbum(@PathVariable String slug, @RequestBody Map<String, Object> body) {
    String savedSlug = saveAlbum(slug, body);
    return Result.success(find("gallery_album", "slug", savedSlug));
  }

  @DeleteMapping("/albums/{slug}")
  public Result<Void> deleteAlbum(@PathVariable String slug) {
    jdbcClient.sql("UPDATE gallery_photo SET album=NULL, album_slug=NULL WHERE album_slug=:slug")
        .param("slug", slug).update();
    jdbcClient.sql("DELETE FROM gallery_album WHERE slug=:slug").param("slug", slug).update();
    return Result.success(null);
  }

  @DeleteMapping("/albums")
  public Result<Void> deleteAlbums(@RequestBody Map<String, List<String>> body) {
    for (String slug : body.getOrDefault("slugs", List.of())) deleteAlbum(slug);
    return Result.success(null);
  }

  @PostMapping("/guests")
  public Result<Map<String, Object>> createGuest(@RequestBody Map<String, Object> body) {
    jdbcClient.sql("INSERT INTO gallery_guest (name, avatar_url, fingerprint) VALUES (:name, :avatar, :fp)")
        .param("name", text(body, "name", "访客"))
        .param("avatar", nullableText(body.get("avatar_url")))
        .param("fp", "admin-" + System.currentTimeMillis())
        .update();
    Long id = jdbcClient.sql("SELECT LAST_INSERT_ID()").query(Long.class).single();
    return Result.success(find("gallery_guest", "id", id));
  }

  @PutMapping("/guests/{id}")
  public Result<Map<String, Object>> updateGuest(@PathVariable Long id, @RequestBody Map<String, Object> body) {
    jdbcClient.sql("UPDATE gallery_guest SET name=:name, avatar_url=:avatar WHERE id=:id")
        .param("name", text(body, "name", "访客"))
        .param("avatar", nullableText(body.get("avatar_url")))
        .param("id", id)
        .update();
    return Result.success(find("gallery_guest", "id", id));
  }

  @DeleteMapping("/guests/{id}")
  public Result<Void> deleteGuest(@PathVariable Long id) {
    jdbcClient.sql("DELETE FROM gallery_photo WHERE guest_id=:id").param("id", id).update();
    jdbcClient.sql("DELETE FROM gallery_album WHERE guest_id=:id").param("id", id).update();
    jdbcClient.sql("DELETE FROM gallery_guest WHERE id=:id").param("id", id).update();
    return Result.success(null);
  }

  @DeleteMapping("/guests")
  public Result<Void> deleteGuests(@RequestBody Map<String, List<Long>> body) {
    for (Long id : body.getOrDefault("ids", List.of())) deleteGuest(id);
    return Result.success(null);
  }

  private Long savePhoto(Long id, Map<String, Object> body) throws Exception {
    LocalDate date = parseDate(text(body, "date", LocalDate.now().toString()));
    String tags = objectMapper.writeValueAsString(body.getOrDefault("tags", List.of()));
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("title", text(body, "title", "未命名照片"));
    params.put("description", text(body, "description", ""));
    params.put("location", text(body, "location", ""));
    params.put("date", date);
    params.put("year", date.getYear());
    params.put("category", text(body, "category", "其他"));
    params.put("album", text(body, "album", ""));
    params.put("albumSlug", text(body, "album_slug", ""));
    params.put("device", text(body, "device", "后台上传"));
    params.put("imageUrl", text(body, "image_url", ""));
    params.put("thumbnailUrl", text(body, "thumbnail_url", text(body, "image_url", "")));
    params.put("width", number(body.getOrDefault("width", 1200)));
    params.put("height", number(body.getOrDefault("height", 800)));
    params.put("featured", bool(body.get("is_featured")));
    params.put("approved", !body.containsKey("is_approved") || bool(body.get("is_approved")));
    params.put("tags", tags);
    params.put("ownerType", text(body, "owner_type", "personal"));
    params.put("uploader", text(body, "uploader_name", "小嘟嘟"));
    params.put("guestId", nullableNumber(body.get("guest_id")));
    if (params.get("imageUrl").toString().isBlank()) throw new RuntimeException("请先上传图片");
    ensureAlbum(params);
    if (id == null) {
      jdbcClient.sql("""
          INSERT INTO gallery_photo
            (title, description, location, date, year, category, album, album_slug, device,
             image_url, thumbnail_url, width, height, is_featured, is_approved, tags,
             owner_type, uploader_name, guest_id)
          VALUES
            (:title, :description, :location, :date, :year, :category, :album, :albumSlug, :device,
             :imageUrl, :thumbnailUrl, :width, :height, :featured, :approved, CAST(:tags AS JSON),
             :ownerType, :uploader, :guestId)
          """).params(params).update();
      id = jdbcClient.sql("SELECT LAST_INSERT_ID()").query(Long.class).single();
    } else {
      jdbcClient.sql("""
          UPDATE gallery_photo SET title=:title, description=:description, location=:location,
            date=:date, year=:year, category=:category, album=:album, album_slug=:albumSlug,
            device=:device, image_url=:imageUrl, thumbnail_url=:thumbnailUrl, width=:width,
            height=:height, is_featured=:featured, is_approved=:approved, tags=CAST(:tags AS JSON),
            owner_type=:ownerType, uploader_name=:uploader, guest_id=:guestId
          WHERE id=:id
          """).params(params).param("id", id).update();
    }
    refreshCounts(number(params.get("guestId")).longValue(), params.get("albumSlug").toString());
    return id;
  }

  private void ensureAlbum(Map<String, Object> photo) {
    String slug = photo.get("albumSlug").toString();
    if (slug.isBlank()) return;
    int exists = jdbcClient.sql("SELECT COUNT(*) FROM gallery_album WHERE slug=:slug")
        .param("slug", slug).query(Integer.class).single();
    if (exists > 0) return;
    jdbcClient.sql("""
        INSERT INTO gallery_album
          (slug, name, description, category, cover_url, period, photo_count, owner_type)
        VALUES
          (:slug, :name, '', :category, :cover, :period, 0, :ownerType)
        """)
        .param("slug", slug)
        .param("name", photo.get("album"))
        .param("category", photo.get("category"))
        .param("cover", photo.get("thumbnailUrl"))
        .param("period", String.valueOf(photo.get("year")))
        .param("ownerType", photo.get("ownerType"))
        .update();
  }

  private String saveAlbum(String currentSlug, Map<String, Object> body) {
    String slug = text(body, "slug", currentSlug == null ? "album-" + System.currentTimeMillis() : currentSlug);
    Map<String, Object> params = Map.of(
        "slug", slug,
        "name", text(body, "name", "未命名相册"),
        "description", text(body, "description", ""),
        "category", text(body, "category", "其他"),
        "cover", text(body, "cover_url", ""),
        "period", text(body, "period", String.valueOf(LocalDate.now().getYear())),
        "ownerType", text(body, "owner_type", "personal")
    );
    if (currentSlug == null) {
      jdbcClient.sql("""
          INSERT INTO gallery_album (slug, name, description, category, cover_url, period, owner_type)
          VALUES (:slug, :name, :description, :category, :cover, :period, :ownerType)
          """).params(params).update();
    } else {
      jdbcClient.sql("""
          UPDATE gallery_album SET slug=:slug, name=:name, description=:description,
            category=:category, cover_url=:cover, period=:period, owner_type=:ownerType
          WHERE slug=:currentSlug
          """).params(params).param("currentSlug", currentSlug).update();
      if (!currentSlug.equals(slug)) {
        jdbcClient.sql("UPDATE gallery_photo SET album_slug=:slug, album=:name WHERE album_slug=:currentSlug")
            .param("slug", slug).param("name", params.get("name")).param("currentSlug", currentSlug).update();
      }
    }
    return slug;
  }

  private void refreshCounts(Long guestId, String albumSlug) {
    if (albumSlug != null && !albumSlug.isBlank()) {
      jdbcClient.sql("UPDATE gallery_album SET photo_count=(SELECT COUNT(*) FROM gallery_photo WHERE album_slug=:slug) WHERE slug=:slug")
          .param("slug", albumSlug).update();
    }
    if (guestId != null && guestId > 0) {
      jdbcClient.sql("""
          UPDATE gallery_guest SET
            album_count=(SELECT COUNT(*) FROM gallery_album WHERE guest_id=:id),
            photo_count=(SELECT COUNT(*) FROM gallery_photo WHERE guest_id=:id)
          WHERE id=:id
          """).param("id", guestId).update();
    }
  }

  private Map<String, Object> find(String table, String column, Object value) {
    return jdbcClient.sql("SELECT * FROM " + table + " WHERE " + column + "=:value LIMIT 1")
        .param("value", value).query().listOfRows().stream().findFirst()
        .orElseThrow(() -> new RuntimeException("图库记录不存在"));
  }

  private static String text(Map<String, Object> body, String key, String fallback) {
    String value = Objects.toString(body.get(key), "").trim();
    return value.isBlank() ? fallback : value;
  }

  private static String nullableText(Object value) {
    String text = Objects.toString(value, "").trim();
    return text.isBlank() ? null : text;
  }

  private static Number nullableNumber(Object value) {
    return value instanceof Number number ? number : null;
  }

  private static Number number(Object value) {
    return value instanceof Number number ? number : 0;
  }

  private static boolean bool(Object value) {
    return value instanceof Boolean bool ? bool : "1".equals(String.valueOf(value)) || "true".equalsIgnoreCase(String.valueOf(value));
  }

  private static LocalDate parseDate(String value) {
    try { return LocalDate.parse(value); } catch (Exception ignored) { return LocalDate.now(); }
  }
}
