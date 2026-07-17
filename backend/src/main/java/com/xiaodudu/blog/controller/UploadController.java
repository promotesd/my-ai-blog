package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.service.RedisSupportService;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
public class UploadController {
  private static final Set<String> ALLOWED = Set.of("image/png", "image/jpeg", "image/webp", "image/gif");
  private static final Set<String> ALLOWED_FILES = Set.of(
      "image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf",
      "application/vnd.android.package-archive", "application/octet-stream"
  );
  private static final Set<String> ALLOWED_CATEGORIES = Set.of(
      "blogs", "certificates", "timeline", "projects", "guestbook", "gallery", "general"
  );

  private final RedisSupportService redis;

  public UploadController(RedisSupportService redis) {
    this.redis = redis;
  }

  @Value("${app.upload.dir:uploads}")
  private String uploadDir;

  @Value("${app.upload.public-prefix:/uploads/}")
  private String publicPrefix;

  @PostMapping("/image")
  public Result<Map<String, String>> image(@RequestParam("file") MultipartFile file) throws Exception {
    if (file.isEmpty()) {
      throw new RuntimeException("请选择图片");
    }
    if (!ALLOWED.contains(file.getContentType())) {
      throw new RuntimeException("仅支持 png、jpg、webp、gif 图片");
    }
    String original = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
    String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : ".png";
    String filename = UUID.randomUUID() + ext.toLowerCase();
    Path dir = Path.of(uploadDir).toAbsolutePath();
    Files.createDirectories(dir);
    Files.copy(file.getInputStream(), dir.resolve(filename));
    return Result.success(Map.of("url", publicPrefix + filename));
  }

  @PostMapping("/files")
  public Result<Map<String, String>> file(
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "category", defaultValue = "general") String category,
      HttpServletRequest request
  ) throws Exception {
    if (file.isEmpty()) {
      throw new RuntimeException("请选择文件");
    }
    if (!ALLOWED_FILES.contains(file.getContentType())) {
      throw new RuntimeException("仅支持图片、PDF 和 APK 文件");
    }
    if (!ALLOWED_CATEGORIES.contains(category)) {
      throw new RuntimeException("非法上传分类");
    }
    redis.requireRateLimit("rate:upload:" + request.getRemoteAddr(), Duration.ofSeconds(3));
    String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
    String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
    String filename = UUID.randomUUID() + ext.toLowerCase();
    Path dir = Path.of(uploadDir).toAbsolutePath().resolve(category);
    Files.createDirectories(dir);
    Files.copy(file.getInputStream(), dir.resolve(filename));
    return Result.success(Map.of("url", publicPrefix + category + "/" + filename));
  }

  @PostMapping("/guestbook")
  public Result<Map<String, String>> guestbookAvatar(
      @RequestParam("file") MultipartFile file,
      HttpServletRequest request
  ) throws Exception {
    if (file.isEmpty() || !ALLOWED.contains(file.getContentType())) {
      throw new RuntimeException("留言头像仅支持 png、jpg、webp、gif 图片");
    }
    redis.requireRateLimit("rate:guestbook-upload:" + request.getRemoteAddr(), Duration.ofSeconds(10));
    String original = file.getOriginalFilename() == null ? "avatar" : file.getOriginalFilename();
    String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : ".png";
    String filename = UUID.randomUUID() + ext.toLowerCase();
    Path dir = Path.of(uploadDir).toAbsolutePath().resolve("guestbook");
    Files.createDirectories(dir);
    Files.copy(file.getInputStream(), dir.resolve(filename));
    return Result.success(Map.of("url", publicPrefix + "guestbook/" + filename));
  }

  @PostMapping("/gallery")
  public Result<Map<String, String>> galleryPhoto(
      @RequestParam("file") MultipartFile file,
      HttpServletRequest request
  ) throws Exception {
    if (file.isEmpty() || !ALLOWED.contains(file.getContentType())) {
      throw new RuntimeException("图库仅支持 png、jpg、webp、gif 图片");
    }
    if (file.getSize() > 15L * 1024 * 1024) {
      throw new RuntimeException("单张图片不能超过 15MB");
    }
    redis.requireRateLimit("rate:gallery-upload:" + request.getRemoteAddr(), Duration.ofMillis(200));
    String original = file.getOriginalFilename() == null ? "gallery" : file.getOriginalFilename();
    String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : ".png";
    String filename = UUID.randomUUID() + ext.toLowerCase();
    Path dir = Path.of(uploadDir).toAbsolutePath().resolve("gallery");
    Files.createDirectories(dir);
    Files.copy(file.getInputStream(), dir.resolve(filename), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
    return Result.success(Map.of("url", publicPrefix + "gallery/" + filename));
  }

  @PostMapping("/resume")
  public Result<Map<String, String>> resume(@RequestParam("file") MultipartFile file) throws Exception {
    if (file.isEmpty()) {
      throw new RuntimeException("请选择简历 PDF");
    }
    if (!"application/pdf".equals(file.getContentType())) {
      throw new RuntimeException("简历只支持 PDF 文件");
    }
    Path dir = Path.of(uploadDir).toAbsolutePath().resolve("resume");
    Files.createDirectories(dir);
    Path target = dir.resolve("resume.pdf");
    Files.copy(file.getInputStream(), target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
    return Result.success(Map.of(
        "url", publicPrefix + "resume/resume.pdf",
        "filename", "resume.pdf"
    ));
  }

  @GetMapping("/images")
  public Result<List<Map<String, Object>>> images() throws Exception {
    Path dir = Path.of(uploadDir).toAbsolutePath();
    if (!Files.exists(dir)) {
      return Result.success(List.of());
    }
    List<Map<String, Object>> files = Files.list(dir)
        .filter(Files::isRegularFile)
        .sorted(Comparator.comparing(path -> path.toFile().lastModified(), Comparator.reverseOrder()))
        .map(path -> Map.<String, Object>of(
            "name", path.getFileName().toString(),
            "url", publicPrefix + path.getFileName(),
            "size", path.toFile().length(),
            "updatedAt", path.toFile().lastModified()
        ))
        .toList();
    return Result.success(files);
  }

  @DeleteMapping("/images/{name}")
  public Result<Void> delete(@PathVariable String name) throws Exception {
    if (name.contains("/") || name.contains("..")) {
      throw new RuntimeException("非法文件名");
    }
    Files.deleteIfExists(Path.of(uploadDir).toAbsolutePath().resolve(name));
    return Result.success(null);
  }
}
