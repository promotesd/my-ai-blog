package com.xiaodudu.blog.mapper;

import com.xiaodudu.blog.entity.Paper;
import java.util.List;

public interface PaperMapper {
  List<Paper> findAll();

  Paper findById(Long id);
  int insert(Paper paper);
  int update(Paper paper);
  int deleteById(Long id);

  int incrementLikeCount(Long id);
}
