package com.xiaodudu.blog.service;

import com.xiaodudu.blog.entity.Post;
import com.xiaodudu.blog.dto.PostRequest;
import java.util.List;

public interface PostService {
  List<Post> listPublished();

  List<Post> listAdmin();

  Post getBySlug(String slug);

  Post getById(Long id);

  Post create(PostRequest request);

  Post update(Long id, PostRequest request);

  void delete(Long id);
}
