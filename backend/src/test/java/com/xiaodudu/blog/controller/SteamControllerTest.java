package com.xiaodudu.blog.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

class SteamControllerTest {
  private static final String GAMES_PAYLOAD = """
      {"response":{"game_count":2,"games":[
        {"appid":1,"name":"Visible Game","playtime_forever":60},
        {"appid":2,"name":"Hidden Game","playtime_forever":120}
      ]}}
      """;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void returnsCachedRealGamesImmediatelyAndFiltersConfiguredPrivateGames(@TempDir Path tempDir) throws Exception {
    Path cache = tempDir.resolve("steam-games.json");
    Files.writeString(cache, GAMES_PAYLOAD);
    SteamController controller = controller(cache, "http://127.0.0.1:1", "2");
    ((AtomicLong) ReflectionTestUtils.getField(controller, "lastRefreshAttempt"))
        .set(System.currentTimeMillis());

    ResponseEntity<String> response = controller.ownedGames();
    JsonNode games = objectMapper.readTree(response.getBody()).path("response").path("games");

    assertThat(response.getHeaders().getFirst("X-Steam-Source")).isEqualTo("cache");
    assertThat(response.getHeaders().getFirst("X-Steam-Updated-At")).isNotBlank();
    assertThat(games).hasSize(1);
    assertThat(games.get(0).path("name").asText()).isEqualTo("Visible Game");
  }

  @Test
  void fetchesOfficialApiPayloadAndCreatesCacheWhenCacheDoesNotExist(@TempDir Path tempDir) throws Exception {
    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/IPlayerService/GetOwnedGames/v0001/", exchange -> {
      byte[] body = GAMES_PAYLOAD.getBytes(StandardCharsets.UTF_8);
      exchange.getResponseHeaders().add("Content-Type", "application/json");
      exchange.sendResponseHeaders(200, body.length);
      exchange.getResponseBody().write(body);
      exchange.close();
    });
    server.start();
    Path cache = tempDir.resolve("steam-games.json");
    try {
      SteamController controller = controller(cache, "http://127.0.0.1:" + server.getAddress().getPort(), "2");

      ResponseEntity<String> response = controller.ownedGames();
      JsonNode games = objectMapper.readTree(response.getBody()).path("response").path("games");

      assertThat(response.getHeaders().getFirst("X-Steam-Source")).isEqualTo("live");
      assertThat(games).hasSize(1);
      assertThat(Files.readString(cache)).isEqualTo(GAMES_PAYLOAD);
    } finally {
      server.stop(0);
    }
  }

  @Test
  void returnsStableEmptyPayloadWhenSteamIsNotConfigured(@TempDir Path tempDir) throws Exception {
    SteamController controller = new SteamController(objectMapper);
    ReflectionTestUtils.setField(controller, "apiKey", "");
    ReflectionTestUtils.setField(controller, "steamId", "");
    ReflectionTestUtils.setField(controller, "cacheFile", tempDir.resolve("missing.json").toString());

    JsonNode games = objectMapper.readTree(controller.ownedGames().getBody()).path("response").path("games");

    assertThat(games).isEmpty();
  }

  private SteamController controller(Path cache, String apiBaseUrl, String hiddenAppIds) {
    SteamController controller = new SteamController(objectMapper);
    ReflectionTestUtils.setField(controller, "apiKey", "test-key");
    ReflectionTestUtils.setField(controller, "steamId", "76561199152950377");
    ReflectionTestUtils.setField(controller, "apiBaseUrl", apiBaseUrl);
    ReflectionTestUtils.setField(controller, "cacheFile", cache.toString());
    ReflectionTestUtils.setField(controller, "hiddenAppIds", hiddenAppIds);
    return controller;
  }
}
