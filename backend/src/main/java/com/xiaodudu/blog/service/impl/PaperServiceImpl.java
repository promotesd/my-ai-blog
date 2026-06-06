package com.xiaodudu.blog.service.impl;

import com.xiaodudu.blog.entity.Paper;
import com.xiaodudu.blog.mapper.PaperMapper;
import com.xiaodudu.blog.service.PaperService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PaperServiceImpl implements PaperService {
  private final PaperMapper paperMapper;

  public PaperServiceImpl(PaperMapper paperMapper) {
    this.paperMapper = paperMapper;
  }

  @Override
  public List<Paper> listAll() {
    return paperMapper.findAll();
  }

  @Override
  public Paper getById(Long id) {
    Paper paper = paperMapper.findById(id);
    if (paper == null) {
      throw new RuntimeException("论文不存在");
    }
    return paper;
  }
}
