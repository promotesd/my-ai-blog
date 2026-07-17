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
import java.time.Duration;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SteamController {
  private static final String EMPTY_GAMES = "{\"response\":{\"game_count\":0,\"games\":[]}}";

  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(8))
      .build();
  private final ObjectMapper objectMapper;
  private volatile VisibilitySnapshot visibilitySnapshot;

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

  @Value("${app.steam.visible-games-url:}")
  private String visibleGamesUrl;

  @Value("${app.steam.visibility-cache-file:uploads/steam/visible-games.json}")
  private String visibilityCacheFile;

  @GetMapping(value = "/api/steam-games", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<String> ownedGames() {
    if (apiKey == null || apiKey.isBlank() || steamId == null || steamId.isBlank()) {
      return ResponseEntity.ok(EMPTY_GAMES);
    }

    String url = apiBaseUrl.replaceAll("/+$", "") + "/IPlayerService/GetOwnedGames/v0001/"
        + "?key=" + enc(apiKey)
        + "&steamid=" + enc(steamId)
        + "&format=json"
        + "&include_appinfo=true"
        + "&include_played_free_games=true";

    try {
      HttpRequest request = HttpRequest.newBuilder(URI.create(url))
          .timeout(Duration.ofSeconds(12))
          .GET()
          .build();
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300 || response.body().isBlank()) {
        throw new IllegalStateException("Steam API returned " + response.statusCode());
      }
      Path target = Path.of(cacheFile).toAbsolutePath();
      Files.createDirectories(target.getParent());
      Files.writeString(target, response.body());
      return ResponseEntity.ok().header("X-Steam-Source", "live").body(filterHiddenGames(response.body()));
    } catch (Exception ex) {
      try {
        Path target = Path.of(cacheFile).toAbsolutePath();
        if (Files.isRegularFile(target)) {
          return ResponseEntity.ok().header("X-Steam-Source", "cache")
              .body(filterHiddenGames(Files.readString(target)));
        }
      } catch (Exception ignored) {
        // Return a stable empty payload when neither Steam nor the cache is available.
      }
      return ResponseEntity.ok()
          .header("X-Steam-Source", "unavailable")
          .body("{\"response\":{\"game_count\":0,\"games\":[]},\"error\":\"steam_api_unavailable\"}");
    }
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

    Optional<Set<Integer>> visibleIds = loadVisibleAppIds();

    if (excludedIds.isEmpty() && visibleIds.isEmpty()) {
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
        return excludedIds.contains(appId) || visibleIds.map(ids -> !ids.contains(appId)).orElse(false);
      });
      responseObject.put("game_count", gamesArray.size());
      return objectMapper.writeValueAsString(root);
    } catch (Exception ignored) {
      return payload;
    }
  }

  private Optional<Set<Integer>> loadVisibleAppIds() {
    if (visibleGamesUrl == null || visibleGamesUrl.isBlank()) {
      return Optional.empty();
    }

    VisibilitySnapshot current = visibilitySnapshot;
    if (current != null && current.loadedAt().plusSeconds(300).isAfter(Instant.now())) {
      return Optional.of(current.appIds());
    }

    synchronized (this) {
      current = visibilitySnapshot;
      if (current != null && current.loadedAt().plusSeconds(300).isAfter(Instant.now())) {
        return Optional.of(current.appIds());
      }

      try {
        HttpRequest request = HttpRequest.newBuilder(URI.create(visibleGamesUrl))
            .timeout(Duration.ofSeconds(8))
            .header("Cache-Control", "no-cache")
            .GET()
            .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
          throw new IllegalStateException("Visible games source returned " + response.statusCode());
        }
        Set<Integer> appIds = parseVisibleAppIds(response.body());
        Path target = Path.of(visibilityCacheFile).toAbsolutePath();
        Files.createDirectories(target.getParent());
        Files.writeString(target, response.body());
        visibilitySnapshot = new VisibilitySnapshot(appIds, Instant.now());
        return Optional.of(appIds);
      } catch (Exception ignored) {
        try {
          Path target = Path.of(visibilityCacheFile).toAbsolutePath();
          if (Files.isRegularFile(target)) {
            Set<Integer> appIds = parseVisibleAppIds(Files.readString(target));
            visibilitySnapshot = new VisibilitySnapshot(appIds, Instant.now());
            return Optional.of(appIds);
          }
        } catch (Exception cacheIgnored) {
          // Keep the full Steam response when no verified public list is available.
        }
        return current == null ? Optional.empty() : Optional.of(current.appIds());
      }
    }
  }

  private Set<Integer> parseVisibleAppIds(String payload) throws Exception {
    JsonNode root = objectMapper.readTree(payload);
    if (!root.path("ready").asBoolean(false) || !root.path("appids").isArray()) {
      throw new IllegalArgumentException("Visible games list is not ready");
    }
    Set<Integer> result = new HashSet<>();
    root.path("appids").forEach(node -> {
      if (node.canConvertToInt()) {
        result.add(node.asInt());
      }
    });
    return Set.copyOf(result);
  }

  private record VisibilitySnapshot(Set<Integer> appIds, Instant loadedAt) {
  }
}
