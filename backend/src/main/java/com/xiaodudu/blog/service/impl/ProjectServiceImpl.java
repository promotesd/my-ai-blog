package com.xiaodudu.blog.service.impl;

import com.xiaodudu.blog.entity.Project;
import com.xiaodudu.blog.mapper.ProjectMapper;
import com.xiaodudu.blog.service.ProjectService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProjectServiceImpl implements ProjectService {
  private final ProjectMapper projectMapper;

  public ProjectServiceImpl(ProjectMapper projectMapper) {
    this.projectMapper = projectMapper;
  }

  @Override
  public List<Project> listAll() {
    return projectMapper.findAll();
  }

  @Override
  public Project getBySlug(String slug) {
    Project project = projectMapper.findBySlug(slug);
    if (project == null) {
      throw new RuntimeException("项目不存在");
    }
    return project;
  }
}
