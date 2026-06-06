package com.xiaodudu.blog.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {
  private static final ObjectMapper MAPPER = new ObjectMapper();

  @Value("${app.jwt.secret}")
  private String secret;

  @Value("${app.jwt.expire-hours:72}")
  private long expireHours;

  public String generate(String username, String role) {
    long exp = Instant.now().plusSeconds(expireHours * 3600).getEpochSecond();
    Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("sub", username);
    payload.put("role", role);
    payload.put("exp", exp);
    String headerPart = encodeJson(header);
    String payloadPart = encodeJson(payload);
    return headerPart + "." + payloadPart + "." + sign(headerPart + "." + payloadPart);
  }

  public Map<String, Object> parse(String token) {
    try {
      String[] parts = token.split("\\.");
      if (parts.length != 3 || !sign(parts[0] + "." + parts[1]).equals(parts[2])) {
        throw new RuntimeException("无效 token");
      }
      Map<String, Object> payload = MAPPER.readValue(Base64.getUrlDecoder().decode(parts[1]), new TypeReference<>() {});
      Number exp = (Number) payload.get("exp");
      if (exp == null || Instant.now().getEpochSecond() > exp.longValue()) {
        throw new RuntimeException("登录已过期");
      }
      return payload;
    } catch (Exception exception) {
      throw new RuntimeException("无效 token");
    }
  }

  private String encodeJson(Object value) {
    try {
      return Base64.getUrlEncoder().withoutPadding().encodeToString(MAPPER.writeValueAsBytes(value));
    } catch (Exception exception) {
      throw new RuntimeException("JWT 编码失败");
    }
  }

  private String sign(String value) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception exception) {
      throw new RuntimeException("JWT 签名失败");
    }
  }
}
