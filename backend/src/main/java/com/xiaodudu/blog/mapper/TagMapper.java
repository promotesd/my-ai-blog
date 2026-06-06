package com.xiaodudu.blog.mapper;

import com.xiaodudu.blog.entity.Tag;
import java.util.List;

public interface TagMapper {
  List<Tag> findAll();
  Tag findById(Long id);
  int insert(Tag tag);
  int update(Tag tag);
  int deleteById(Long id);
}
