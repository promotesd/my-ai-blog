package com.xiaodudu.blog.service;

import com.xiaodudu.blog.entity.Paper;
import java.util.List;

public interface PaperService {
  List<Paper> listAll();

  Paper getById(Long id);
}
