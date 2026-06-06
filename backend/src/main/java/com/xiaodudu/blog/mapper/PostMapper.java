package com.xiaodudu.blog.mapper;

import com.xiaodudu.blog.entity.Post;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface PostMapper {
  List<Post> findPublished();

  List<Post> findAllForAdmin();

  Post findBySlug(String slug);

  Post findById(Long id);

  int insert(Post post);

  int update(Post post);

  int deleteById(Long id);

  int deleteTags(@Param("postId") Long postId);

  int insertTag(@Param("postId") Long postId, @Param("tagId") Long tagId);

  int incrementViewCount(Long id);

  int incrementLikeCount(Long id);
}
