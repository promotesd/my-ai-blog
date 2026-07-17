package com.xiaodudu.blog.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SteamController {
  private static final String EMPTY_GAMES = "{\"response\":{\"game_count\":0,\"games\":[]}}";
  private static final long REFRESH_RETRY_MILLIS = Duration.ofMinutes(5).toMillis();
  private static final Logger log = LoggerFactory.getLogger(SteamController.class);

  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(8))
      .build();
  private final ObjectMapper objectMapper;
  private final AtomicBoolean refreshInProgress = new AtomicBoolean(false);
  private final AtomicLong lastRefreshAttempt = new AtomicLong(0);

  public SteamController(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Value("${app.steam.api-key:}")
  private String apiKey;

  @Value("${app.steam.steam-id:}")
  private String steamId;

  @Value("${app.steam.api-base-url:https://api.steampowered.com}")
  private String apiBaseUrl;

  @Value("${app.steam.cache-file:uploads/steam/games.json}")
  private String cacheFile;

  @Value("${app.steam.hidden-app-ids:}")
  private String hiddenAppIds;

  @GetMapping(value = "/api/steam-games", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<String> ownedGames() {
    if (apiKey == null || apiKey.isBlank() || steamId == null || steamId.isBlank()) {
      return ResponseEntity.ok(EMPTY_GAMES);
    }

    Optional<CachedGames> cached = readCache();
    if (cached.isPresent()) {
      refreshCacheInBackground();
      CachedGames games = cached.get();
      return ResponseEntity.ok()
          .header("X-Steam-Source", "cache")
          .header("X-Steam-Updated-At", String.valueOf(games.updatedAt()))
          .body(filterHiddenGames(games.payload()));
    }

    try {
      String payload = fetchAndCacheGames();
      return ResponseEntity.ok()
          .header("X-Steam-Source", "live")
          .header("X-Steam-Updated-At", String.valueOf(System.currentTimeMillis()))
          .body(filterHiddenGames(payload));
    } catch (Exception ex) {
      log.warn("Steam API is unavailable and no cache exists: {}", ex.getMessage());
      return ResponseEntity.ok()
          .header("X-Steam-Source", "unavailable")
          .body("{\"response\":{\"game_count\":0,\"games\":[]},\"error\":\"steam_api_unavailable\"}");
    }
  }

  private String fetchAndCacheGames() throws Exception {
    String url = apiBaseUrl.replaceAll("/+$", "") + "/IPlayerService/GetOwnedGames/v0001/"
        + "?key=" + enc(apiKey)
        + "&steamid=" + enc(steamId)
        + "&format=json"
        + "&include_appinfo=true"
        + "&include_played_free_games=true";

    HttpRequest request = HttpRequest.newBuilder(URI.create(url))
        .timeout(Duration.ofSeconds(12))
        .GET()
        .build();
    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300 || response.body().isBlank()) {
      throw new IllegalStateException("Steam API returned " + response.statusCode());
    }
    JsonNode root = objectMapper.readTree(response.body());
    if (!root.path("response").path("games").isArray()) {
      throw new IllegalStateException("Steam API returned an invalid games payload");
    }

    Path target = Path.of(cacheFile).toAbsolutePath();
    Files.createDirectories(target.getParent());
    Path temporary = target.resolveSibling(target.getFileName() + ".tmp");
    Files.writeString(temporary, response.body());
    try {
      Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    } catch (java.nio.file.AtomicMoveNotSupportedException ignored) {
      Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING);
    }
    return response.body();
  }

  private Optional<CachedGames> readCache() {
    try {
      Path target = Path.of(cacheFile).toAbsolutePath();
      if (Files.isRegularFile(target)) {
        return Optional.of(new CachedGames(Files.readString(target), Files.getLastModifiedTime(target).toMillis()));
      }
    } catch (Exception ex) {
      log.warn("Unable to read Steam cache: {}", ex.getMessage());
    }
    return Optional.empty();
  }

  private void refreshCacheInBackground() {
    long now = System.currentTimeMillis();
    long previousAttempt = lastRefreshAttempt.get();
    if (now - previousAttempt < REFRESH_RETRY_MILLIS || !refreshInProgress.compareAndSet(false, true)) {
      return;
    }
    lastRefreshAttempt.set(now);
    CompletableFuture.runAsync(() -> {
      try {
        fetchAndCacheGames();
        log.info("Steam games cache refreshed from the official API");
      } catch (Exception ex) {
        log.warn("Steam background refresh failed; retaining the last valid cache: {}", ex.getMessage());
      } finally {
        refreshInProgress.set(false);
      }
    });
  }

  private static String enc(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private String filterHiddenGames(String payload) {
    Set<Integer> excludedIds = Arrays.stream(hiddenAppIds == null ? new String[0] : hiddenAppIds.split(","))
        .map(String::trim)
        .filter(value -> !value.isEmpty())
        .flatMap(value -> {
          try {
            return java.util.stream.Stream.of(Integer.parseInt(value));
          } catch (NumberFormatException ignored) {
            return java.util.stream.Stream.empty();
          }
        })
        .collect(Collectors.toSet());

    if (excludedIds.isEmpty()) {
      return payload;
    }

    try {
      ObjectNode root = (ObjectNode) objectMapper.readTree(payload);
      JsonNode response = root.path("response");
      JsonNode games = response.path("games");
      if (!(response instanceof ObjectNode responseObject) || !(games instanceof ArrayNode gamesArray)) {
        return payload;
      }
      gamesArray.removeIf(game -> {
        int appId = game.path("appid").asInt();
        return excludedIds.contains(appId);
      });
      responseObject.put("game_count", gamesArray.size());
      return objectMapper.writeValueAsString(root);
    } catch (Exception ignored) {
      return payload;
    }
  }

  private record CachedGames(String payload, long updatedAt) {}
}
