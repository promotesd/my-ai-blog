package com.xiaodudu.blog.controller;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EntertainmentController {
  private static final List<Map<String, String>> FAVORITE_ARTISTS = List.of(
      artist("卢广仲", "Crowd Lu", "2JBUyLiFvpFPWdZGqIGYLD"),
      artist("周杰伦", "Jay Chou", "2elBjNSdBE2Y3f0j1mjrql"),
      artist("林俊杰", "JJ Lin", "7Dx7RhX0mFuXhCOUgB01uM"),
      artist("王力宏", "Leehom Wang", "2F5W6Rsxwzg0plQ0w8dSyt"),
      artist("郭静", "Claire Kuo", "6OiFtK426XJWnOJ2HYlSbf"),
      artist("梁静茹", "Fish Leong", "3aIDSTKS9yH745GUQBxDcS"),
      artist("陈奕迅", "Eason Chan", "2QcZxAgcs2I1q7CtCkl6MI"),
      artist("孙燕姿", "Stefanie Sun", "0SIXZXJCAhNU8sxK0qm7hn")
  );

  @GetMapping("/api/music-data")
  public Map<String, Object> music() {
    return Map.of("artists", FAVORITE_ARTISTS);
  }

  @GetMapping("/api/books-data")
  public Map<String, Object> books() {
    return Map.of("books", List.of());
  }

  @GetMapping("/api/notion-watchread")
  public Map<String, Object> watchRead() {
    return Map.of("items", List.of());
  }

  @GetMapping("/api/mobile-games")
  public Map<String, Object> mobileGames() {
    return Map.of("games", List.of());
  }

  private static Map<String, String> artist(String name, String englishName, String spotifyArtistId) {
    return Map.of(
        "name", name,
        "english_name", englishName,
        "spotify_artist_id", spotifyArtistId,
        "spotify_url", "https://open.spotify.com/artist/" + spotifyArtistId
    );
  }
}
