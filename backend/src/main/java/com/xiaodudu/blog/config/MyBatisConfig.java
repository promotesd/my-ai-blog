package com.xiaodudu.blog.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.xiaodudu.blog.mapper")
public class MyBatisConfig {
}
