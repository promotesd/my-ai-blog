package com.xiaodudu.blog.service;

import java.util.Arrays;

public enum PortfolioResource {
  BLOGS("blogs", "blog", true),
  PROJECTS("projects", "project", true),
  SKILLS("skills", "skill", false),
  CERTIFICATES("certificates", "certificate", true),
  TIMELINES("timelines", "timeline", true),
  WORK_EXPERIENCES("work-experiences", "work_experience", false),
  CODING_JOURNEY("coding-journey", "coding_journey", false),
  TECH_TOOLS("tech-tools", "tech_tool", false),
  DEPLOYED_PROJECTS("deployed-projects", "deployed_project", true),
  DIARIES("diaries", "diary", true),
  PORTFOLIO_STATS("portfolio-stats", "portfolio_stats", false);

  private final String path;
  private final String table;
  private final boolean slugSupported;

  PortfolioResource(String path, String table, boolean slugSupported) {
    this.path = path;
    this.table = table;
    this.slugSupported = slugSupported;
  }

  public String path() {
    return path;
  }

  public String table() {
    return table;
  }

  public boolean slugSupported() {
    return slugSupported;
  }

  public static PortfolioResource fromPath(String path) {
    return Arrays.stream(values())
        .filter(resource -> resource.path.equals(path))
        .findFirst()
        .orElseThrow(() -> new RuntimeException("不支持的资源类型: " + path));
  }
}
