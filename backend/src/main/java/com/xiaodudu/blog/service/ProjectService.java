package com.xiaodudu.blog.service;

import com.xiaodudu.blog.entity.Project;
import java.util.List;

public interface ProjectService {
  List<Project> listAll();

  Project getBySlug(String slug);
}
