package com.xiaodudu.blog.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.xiaodudu.blog.service.PortfolioContentService;
import java.io.StringReader;
import java.util.List;
import java.util.Map;
import javax.xml.parsers.DocumentBuilderFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.xml.sax.InputSource;

class FeedControllerTest {
  @Test
  void blogFeedProducesValidRssWithPublishedContent() throws Exception {
    PortfolioContentService contentService = org.mockito.Mockito.mock(PortfolioContentService.class);
    when(contentService.list("blogs", false)).thenReturn(List.of(
        Map.of(
            "id", 7,
            "slug", "lidar-notes",
            "title", "LiDAR & SLAM 笔记",
            "excerpt", "从点云开始",
            "status", "published",
            "published_at", "2026-07-17T12:00:00Z"),
        Map.of("id", 8, "title", "草稿", "status", "draft")));

    ResponseEntity<String> response = new FeedController(contentService).blogFeed();
    var factory = DocumentBuilderFactory.newInstance();
    factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
    var document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(response.getBody())));

    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(response.getHeaders().getContentType().toString()).startsWith("application/rss+xml");
    assertThat(document.getDocumentElement().getNodeName()).isEqualTo("rss");
    assertThat(document.getElementsByTagName("item").getLength()).isEqualTo(1);
    assertThat(document.getElementsByTagName("title").item(1).getTextContent()).isEqualTo("LiDAR & SLAM 笔记");
    assertThat(document.getElementsByTagName("link").item(1).getTextContent())
        .isEqualTo("https://www.xiaodudu.top/blogs/lidar-notes");
  }
}
