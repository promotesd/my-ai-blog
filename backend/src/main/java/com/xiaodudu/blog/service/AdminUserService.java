package com.xiaodudu.blog.service;

import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminUserService {
  private final JdbcClient jdbcClient;
  private final PasswordEncoder passwordEncoder;

  public AdminUserService(JdbcClient jdbcClient, PasswordEncoder passwordEncoder) {
    this.jdbcClient = jdbcClient;
    this.passwordEncoder = passwordEncoder;
  }

  public Map<String, Object> authenticate(String username, String password) {
    Map<String, Object> user = jdbcClient.sql("""
        SELECT username, password_hash, nickname, role
        FROM `user`
        WHERE username = :username
        LIMIT 1
        """)
        .param("username", username)
        .query()
        .listOfRows()
        .stream()
        .findFirst()
        .orElseThrow(() -> new RuntimeException("用户名或密码错误"));
    if (!passwordEncoder.matches(password, String.valueOf(user.get("password_hash")))) {
      throw new RuntimeException("用户名或密码错误");
    }
    return user;
  }
}
