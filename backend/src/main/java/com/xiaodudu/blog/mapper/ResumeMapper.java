package com.xiaodudu.blog.mapper;

import com.xiaodudu.blog.entity.ResumeSection;
import java.util.List;

public interface ResumeMapper {
  List<ResumeSection> findVisible();
}
