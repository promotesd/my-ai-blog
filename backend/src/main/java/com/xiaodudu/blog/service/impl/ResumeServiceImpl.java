package com.xiaodudu.blog.service.impl;

import com.xiaodudu.blog.entity.ResumeSection;
import com.xiaodudu.blog.mapper.ResumeMapper;
import com.xiaodudu.blog.service.ResumeService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ResumeServiceImpl implements ResumeService {
  private final ResumeMapper resumeMapper;

  public ResumeServiceImpl(ResumeMapper resumeMapper) {
    this.resumeMapper = resumeMapper;
  }

  @Override
  public List<ResumeSection> listVisible() {
    return resumeMapper.findVisible();
  }
}
