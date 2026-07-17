package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.entity.ResumeSection;
import com.xiaodudu.blog.service.ResumeService;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {
  private final ResumeService resumeService;

  @Value("${app.upload.dir:uploads}")
  private String uploadDir;

  @Value("${app.upload.public-prefix:/uploads/}")
  private String publicPrefix;

  public ResumeController(ResumeService resumeService) {
    this.resumeService = resumeService;
  }

  @GetMapping
  public Result<List<ResumeSection>> list() {
    return Result.success(resumeService.listVisible());
  }

  @GetMapping("/status")
  public Result<Map<String, Object>> status() {
    Path file = Path.of(uploadDir).toAbsolutePath().resolve("resume").resolve("resume.pdf");
    boolean uploaded = Files.exists(file) && Files.isRegularFile(file);
    return Result.success(Map.of(
        "uploaded", uploaded,
        "url", uploaded ? publicPrefix + "resume/resume.pdf" : "",
        "filename", uploaded ? "resume.pdf" : "",
        "updatedAt", uploaded ? file.toFile().lastModified() : 0L
    ));
  }
}
