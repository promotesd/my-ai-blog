package com.xiaodudu.blog.mapper;

import com.xiaodudu.blog.entity.Project;
import java.util.List;

public interface ProjectMapper {
  List<Project> findAll();

  Project findBySlug(String slug);
  Project findById(Long id);
  int insert(Project project);
  int update(Project project);
  int deleteById(Long id);

  int incrementLikeCount(Long id);
}
