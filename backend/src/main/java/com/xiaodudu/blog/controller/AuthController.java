package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.common.Result;
import com.xiaodudu.blog.dto.LoginRequest;
import com.xiaodudu.blog.service.AdminUserService;
import com.xiaodudu.blog.util.JwtUtil;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final JwtUtil jwtUtil;
  private final AdminUserService adminUserService;

  public AuthController(JwtUtil jwtUtil, AdminUserService adminUserService) {
    this.jwtUtil = jwtUtil;
    this.adminUserService = adminUserService;
  }

  @PostMapping("/login")
  public Result<Map<String, String>> login(@Valid @RequestBody LoginRequest request) {
    Map<String, Object> user = adminUserService.authenticate(request.getUsername(), request.getPassword());
    String username = String.valueOf(user.get("username"));
    String role = String.valueOf(user.get("role"));
    return Result.success("login success", Map.of(
        "token", jwtUtil.generate(username, role),
        "nickname", String.valueOf(user.getOrDefault("nickname", username)),
        "role", role
    ));
  }
}
