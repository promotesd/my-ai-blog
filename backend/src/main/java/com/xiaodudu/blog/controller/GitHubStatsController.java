package com.xiaodudu.blog.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class GitHubStatsController {
  private static final Logger log = LoggerFactory.getLogger(GitHubStatsController.class);

  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(4))
      .build();
  private final ObjectMapper objectMapper;
  private final String username;
  private final String token;

  public GitHubStatsController(
      ObjectMapper objectMapper,
      @Value("${app.github.username:agungkurniawanid}") String username,
      @Value("${app.github.token:}") String token
  ) {
    this.objectMapper = objectMapper;
    this.username = username;
    this.token = token;
  }

  @GetMapping("/github-stats")
  public Map<String, Integer> githubStats() {
    GitHubCounts counts = fetchGitHubCounts();
    return Map.of(
        "contributions", counts.contributions(),
        "public_repos", counts.publicRepos(),
        "private_repos", counts.privateRepos()
    );
  }

  private GitHubCounts fetchGitHubCounts() {
    int publicRepos = fetchPublicRepos();
    GraphQLCounts graphQLCounts = fetchGraphQLCounts();
    return new GitHubCounts(publicRepos, graphQLCounts.contributions(), graphQLCounts.privateRepos());
  }

  private int fetchPublicRepos() {
    try {
      HttpRequest.Builder builder = HttpRequest.newBuilder()
          .uri(URI.create("https://api.github.com/users/" + username))
          .timeout(Duration.ofSeconds(6))
          .header("Accept", "application/vnd.github+json")
          .header("User-Agent", "xiaodudu-portfolio");

      if (token != null && !token.isBlank()) {
        builder.header("Authorization", "Bearer " + token);
      }

      HttpResponse<String> response = httpClient.send(builder.GET().build(), HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        log.warn("GitHub user API returned status {}", response.statusCode());
        return 0;
      }

      JsonNode root = objectMapper.readTree(response.body());
      return Math.max(0, root.path("public_repos").asInt(0));
    } catch (Exception exception) {
      log.warn("Failed to fetch GitHub stats, returning fallback values: {}", exception.getMessage());
      return 0;
    }
  }

  private GraphQLCounts fetchGraphQLCounts() {
    if (token == null || token.isBlank()) {
      log.warn("GITHUB_TOKEN is not configured; returning fallback GitHub contribution stats");
      return new GraphQLCounts(0, 0);
    }

    try {
      ObjectNode body = objectMapper.createObjectNode();
      body.put("query", """
          query($login: String!) {
            user(login: $login) {
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                }
              }
            }
            viewer {
              repositories(privacy: PRIVATE, ownerAffiliations: OWNER) {
                totalCount
              }
            }
          }
          """);
      ObjectNode variables = objectMapper.createObjectNode();
      variables.put("login", username);
      body.set("variables", variables);

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://api.github.com/graphql"))
          .timeout(Duration.ofSeconds(8))
          .header("Accept", "application/vnd.github+json")
          .header("Content-Type", "application/json")
          .header("User-Agent", "xiaodudu-portfolio")
          .header("Authorization", "Bearer " + token)
          .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        log.warn("GitHub GraphQL API returned status {}", response.statusCode());
        return new GraphQLCounts(0, 0);
      }

      JsonNode root = objectMapper.readTree(response.body());
      int contributions = root.path("data")
          .path("user")
          .path("contributionsCollection")
          .path("contributionCalendar")
          .path("totalContributions")
          .asInt(0);
      int privateRepos = root.path("data")
          .path("viewer")
          .path("repositories")
          .path("totalCount")
          .asInt(0);
      return new GraphQLCounts(Math.max(0, contributions), Math.max(0, privateRepos));
    } catch (Exception exception) {
      log.warn("Failed to fetch GitHub GraphQL stats, returning fallback values: {}", exception.getMessage());
      return new GraphQLCounts(0, 0);
    }
  }

  private record GitHubCounts(int publicRepos, int contributions, int privateRepos) {}

  private record GraphQLCounts(int contributions, int privateRepos) {}
}
