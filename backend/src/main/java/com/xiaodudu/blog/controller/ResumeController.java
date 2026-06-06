package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.entity.ResumeSection;
import com.xiaodudu.blog.service.ResumeService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {
  private final ResumeService resumeService;

  public ResumeController(ResumeService resumeService) {
    this.resumeService = resumeService;
  }

  @GetMapping
  public Result<List<ResumeSection>> list() {
    return Result.success(resumeService.listVisible());
  }
}
