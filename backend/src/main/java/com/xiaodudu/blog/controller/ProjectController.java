package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.dto.ProjectRequest;
import com.xiaodudu.blog.entity.Project;
import com.xiaodudu.blog.mapper.ProjectMapper;
import com.xiaodudu.blog.service.ProjectService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
  private final ProjectService projectService;
  private final ProjectMapper projectMapper;

  public ProjectController(ProjectService projectService, ProjectMapper projectMapper) {
    this.projectService = projectService;
    this.projectMapper = projectMapper;
  }

  @GetMapping
  public Result<List<Project>> list() {
    return Result.success(projectService.listAll());
  }

  @GetMapping("/{slug}")
  public Result<Project> detail(@PathVariable String slug) {
    return Result.success(projectService.getBySlug(slug));
  }

  @PostMapping("/admin")
  public Result<Project> create(@Valid @RequestBody ProjectRequest request) {
    Project project = fromRequest(new Project(), request);
    projectMapper.insert(project);
    return Result.success(project);
  }

  @PutMapping("/admin/{id}")
  public Result<Project> update(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
    Project project = fromRequest(new Project(), request);
    project.setId(id);
    projectMapper.update(project);
    return Result.success(projectMapper.findById(id));
  }

  @DeleteMapping("/admin/{id}")
  public Result<Void> delete(@PathVariable Long id) {
    projectMapper.deleteById(id);
    return Result.success(null);
  }

  private Project fromRequest(Project project, ProjectRequest request) {
    project.setTitle(request.getTitle());
    project.setSlug(request.getSlug());
    project.setDescription(request.getDescription());
    project.setContentMd(request.getContentMd());
    project.setTechStack(request.getTechStack());
    project.setStatus(request.getStatus());
    project.setCategory(request.getCategory());
    project.setGithubUrl(request.getGithubUrl());
    project.setDemoUrl(request.getDemoUrl());
    project.setDocsUrl(request.getDocsUrl());
    project.setCoverUrl(request.getCoverUrl());
    project.setFeatured(Boolean.TRUE.equals(request.getFeatured()));
    return project;
  }
}
