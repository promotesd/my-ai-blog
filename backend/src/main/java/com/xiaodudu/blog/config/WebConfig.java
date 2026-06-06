package com.xiaodudu.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  private final AuthInterceptor authInterceptor;

  @Value("${app.upload.dir:uploads}")
  private String uploadDir;

  @Value("${app.upload.public-prefix:/uploads/}")
  private String publicPrefix;

  public WebConfig(AuthInterceptor authInterceptor) {
    this.authInterceptor = authInterceptor;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(authInterceptor)
        .addPathPatterns("/api/admin/**", "/api/posts/admin", "/api/posts/admin/**", "/api/categories/admin/**", "/api/tags/admin/**", "/api/projects/admin/**", "/api/papers/admin/**", "/api/comments/admin/**", "/api/upload/**")
        .excludePathPatterns("/api/auth/login", "/api/upload/guestbook", "/api/upload/gallery");
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler(publicPrefix + "**")
        .addResourceLocations("file:" + uploadDir + "/");
  }
}
