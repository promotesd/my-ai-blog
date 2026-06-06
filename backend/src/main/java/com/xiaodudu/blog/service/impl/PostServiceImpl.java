package com.xiaodudu.blog.service.impl;

import com.xiaodudu.blog.dto.PostRequest;
import com.xiaodudu.blog.entity.Post;
import com.xiaodudu.blog.mapper.PostMapper;
import com.xiaodudu.blog.service.PostService;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PostServiceImpl implements PostService {
  private final PostMapper postMapper;

  public PostServiceImpl(PostMapper postMapper) {
    this.postMapper = postMapper;
  }

  @Override
  public List<Post> listPublished() {
    return postMapper.findPublished().stream().peek(this::hydrateTags).toList();
  }

  @Override
  public List<Post> listAdmin() {
    return postMapper.findAllForAdmin().stream().peek(this::hydrateTags).toList();
  }

  @Override
  public Post getBySlug(String slug) {
    Post post = postMapper.findBySlug(slug);
    if (post == null) {
      throw new RuntimeException("文章不存在");
    }
    hydrateTags(post);
    return post;
  }

  @Override
  public Post getById(Long id) {
    Post post = postMapper.findById(id);
    if (post == null) {
      throw new RuntimeException("文章不存在");
    }
    hydrateTags(post);
    return post;
  }

  @Override
  public Post create(PostRequest request) {
    Post post = fromRequest(new Post(), request);
    postMapper.insert(post);
    syncTags(post.getId(), request.getTagIds());
    return getById(post.getId());
  }

  @Override
  public Post update(Long id, PostRequest request) {
    if (postMapper.findById(id) == null) {
      throw new RuntimeException("文章不存在");
    }
    Post post = fromRequest(new Post(), request);
    post.setId(id);
    postMapper.update(post);
    syncTags(id, request.getTagIds());
    return getById(id);
  }

  @Override
  public void delete(Long id) {
    postMapper.deleteById(id);
  }

  private void hydrateTags(Post post) {
    if (post.getTagsText() == null || post.getTagsText().isBlank()) {
      post.setTags(Collections.emptyList());
      return;
    }
    post.setTags(Arrays.stream(post.getTagsText().split(",")).map(String::trim).filter(item -> !item.isEmpty()).toList());
  }

  private Post fromRequest(Post post, PostRequest request) {
    post.setTitle(request.getTitle());
    post.setSlug(request.getSlug());
    post.setDescription(request.getDescription());
    post.setContentMd(request.getContentMd());
    post.setCoverUrl(request.getCoverUrl());
    post.setCategoryId(request.getCategoryId());
    post.setAuthorName(request.getAuthorName() == null || request.getAuthorName().isBlank() ? "小嘟嘟" : request.getAuthorName());
    post.setStatus(request.getStatus() == null || request.getStatus().isBlank() ? "draft" : request.getStatus());
    post.setFeatured(Boolean.TRUE.equals(request.getFeatured()));
    return post;
  }

  private void syncTags(Long postId, List<Long> tagIds) {
    postMapper.deleteTags(postId);
    for (Long tagId : tagIds == null ? new ArrayList<Long>() : tagIds) {
      postMapper.insertTag(postId, tagId);
    }
  }
}
