package com.xiaodudu.blog.controller;

import com.xiaodudu.blog.service.PortfolioContentService;
import java.io.StringWriter;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

@RestController
public class FeedController {
  private static final String SITE_URL = "https://www.xiaodudu.top";
  private static final ZoneId SITE_ZONE = ZoneId.of("Asia/Shanghai");
  private static final MediaType RSS_MEDIA_TYPE = MediaType.parseMediaType("application/rss+xml;charset=UTF-8");

  private final PortfolioContentService contentService;

  public FeedController(PortfolioContentService contentService) {
    this.contentService = contentService;
  }

  @GetMapping(value = {"/rss.xml", "/api/rss.xml"}, produces = "application/rss+xml;charset=UTF-8")
  public ResponseEntity<String> blogFeed() {
    return feed("blogs", "小嘟嘟的博客", "小嘟嘟最近发布的博客文章", "/blogs/");
  }

  @GetMapping(value = {"/diary-rss.xml", "/api/diary-rss.xml"}, produces = "application/rss+xml;charset=UTF-8")
  public ResponseEntity<String> diaryFeed() {
    return feed("diaries", "小嘟嘟的日记", "小嘟嘟最近发布的日记", "/diary");
  }

  private ResponseEntity<String> feed(String resource, String title, String description, String path) {
    try {
      List<Map<String, Object>> items = contentService.list(resource, false).stream()
          .filter(this::isPublished)
          .toList();
      return ResponseEntity.ok().contentType(RSS_MEDIA_TYPE).body(toRss(items, title, description, path));
    } catch (Exception exception) {
      throw new RuntimeException("生成 RSS 失败", exception);
    }
  }

  private String toRss(List<Map<String, Object>> items, String title, String description, String path)
      throws Exception {
    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
    factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
    Document document = factory.newDocumentBuilder().newDocument();
    Element rss = document.createElement("rss");
    rss.setAttribute("version", "2.0");
    document.appendChild(rss);
    Element channel = document.createElement("channel");
    rss.appendChild(channel);
    append(document, channel, "title", title);
    append(document, channel, "link", SITE_URL);
    append(document, channel, "description", description);
    append(document, channel, "language", "zh-cn");
    append(document, channel, "lastBuildDate", DateTimeFormatter.RFC_1123_DATE_TIME.format(ZonedDateTime.now(SITE_ZONE)));

    for (Map<String, Object> item : items) {
      Element itemElement = document.createElement("item");
      channel.appendChild(itemElement);
      String id = text(item.get("slug"));
      if (id.isBlank()) id = text(item.get("id"));
      String link = path.endsWith("/") ? SITE_URL + path + id : SITE_URL + path;
      append(document, itemElement, "title", defaultText(item.get("title"), "未命名内容"));
      append(document, itemElement, "link", link);
      append(document, itemElement, "guid", link);
      append(document, itemElement, "description", summary(item));
      append(document, itemElement, "pubDate", publicationDate(item));
    }

    var transformer = TransformerFactory.newInstance().newTransformer();
    transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
    transformer.setOutputProperty(OutputKeys.INDENT, "yes");
    StringWriter output = new StringWriter();
    transformer.transform(new DOMSource(document), new StreamResult(output));
    return output.toString();
  }

  private void append(Document document, Element parent, String name, String value) {
    Element element = document.createElement(name);
    element.appendChild(document.createTextNode(value));
    parent.appendChild(element);
  }

  private boolean isPublished(Map<String, Object> item) {
    String status = text(item.get("status"));
    return status.isBlank() || "published".equalsIgnoreCase(status) || "已发布".equals(status);
  }

  private String summary(Map<String, Object> item) {
    for (String key : List.of("excerpt", "summary", "description", "content")) {
      String value = text(item.get(key)).replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
      if (!value.isBlank()) return value.length() > 240 ? value.substring(0, 240) + "..." : value;
    }
    return "";
  }

  private String publicationDate(Map<String, Object> item) {
    for (String key : List.of("published_at", "date", "created_at", "updated_at")) {
      ZonedDateTime parsed = parseDate(item.get(key));
      if (parsed != null) return DateTimeFormatter.RFC_1123_DATE_TIME.format(parsed);
    }
    return DateTimeFormatter.RFC_1123_DATE_TIME.format(ZonedDateTime.now(SITE_ZONE));
  }

  private ZonedDateTime parseDate(Object value) {
    if (value == null) return null;
    if (value instanceof java.sql.Timestamp timestamp) return timestamp.toLocalDateTime().atZone(SITE_ZONE);
    if (value instanceof java.sql.Date date) return date.toLocalDate().atStartOfDay(SITE_ZONE);
    String raw = text(value);
    if (raw.isBlank()) return null;
    try { return Instant.parse(raw).atZone(SITE_ZONE); } catch (Exception ignored) { }
    try { return LocalDateTime.parse(raw, DateTimeFormatter.ISO_LOCAL_DATE_TIME).atZone(SITE_ZONE); } catch (Exception ignored) { }
    try { return LocalDate.parse(raw, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay(SITE_ZONE); } catch (Exception ignored) { }
    return null;
  }

  private String defaultText(Object value, String fallback) {
    String result = text(value);
    return result.isBlank() ? fallback : result;
  }

  private String text(Object value) {
    return Objects.toString(value, "").trim();
  }
}
