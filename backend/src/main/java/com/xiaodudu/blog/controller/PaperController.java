package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.dto.PaperRequest;
import com.xiaodudu.blog.entity.Paper;
import com.xiaodudu.blog.mapper.PaperMapper;
import com.xiaodudu.blog.service.PaperService;
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
@RequestMapping("/api/papers")
public class PaperController {
  private final PaperService paperService;
  private final PaperMapper paperMapper;

  public PaperController(PaperService paperService, PaperMapper paperMapper) {
    this.paperService = paperService;
    this.paperMapper = paperMapper;
  }

  @GetMapping
  public Result<List<Paper>> list() {
    return Result.success(paperService.listAll());
  }

  @GetMapping("/{id}")
  public Result<Paper> detail(@PathVariable Long id) {
    return Result.success(paperService.getById(id));
  }

  @PostMapping("/admin")
  public Result<Paper> create(@Valid @RequestBody PaperRequest request) {
    Paper paper = fromRequest(new Paper(), request);
    paperMapper.insert(paper);
    return Result.success(paper);
  }

  @PutMapping("/admin/{id}")
  public Result<Paper> update(@PathVariable Long id, @Valid @RequestBody PaperRequest request) {
    Paper paper = fromRequest(new Paper(), request);
    paper.setId(id);
    paperMapper.update(paper);
    return Result.success(paperMapper.findById(id));
  }

  @DeleteMapping("/admin/{id}")
  public Result<Void> delete(@PathVariable Long id) {
    paperMapper.deleteById(id);
    return Result.success(null);
  }

  private Paper fromRequest(Paper paper, PaperRequest request) {
    paper.setTitle(request.getTitle());
    paper.setAuthors(request.getAuthors());
    paper.setVenue(request.getVenue());
    paper.setYear(request.getYear());
    paper.setStatus(request.getStatus());
    paper.setAbstractText(request.getAbstractText());
    paper.setTags(request.getTags());
    paper.setPdfUrl(request.getPdfUrl());
    paper.setCodeUrl(request.getCodeUrl());
    paper.setProjectUrl(request.getProjectUrl());
    paper.setDatasetUrl(request.getDatasetUrl());
    paper.setFeatured(Boolean.TRUE.equals(request.getFeatured()));
    return paper;
  }
}
