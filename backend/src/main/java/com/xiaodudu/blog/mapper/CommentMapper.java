package com.xiaodudu.blog.mapper;

import com.xiaodudu.blog.entity.Comment;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface CommentMapper {
  List<Comment> findAll();
  List<Comment> findApproved(@Param("targetType") String targetType, @Param("targetId") Long targetId);

  int insert(Comment comment);
  int updateStatus(@Param("id") Long id, @Param("status") String status);
  int deleteById(Long id);
}
