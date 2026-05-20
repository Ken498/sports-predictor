package com.sportspredictor.controller;

import com.sportspredictor.model.Comment;
import com.sportspredictor.model.Match;
import com.sportspredictor.model.User;
import com.sportspredictor.repository.CommentRepository;
import com.sportspredictor.service.MatchService;
import com.sportspredictor.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentRepository commentRepo;
    private final MatchService matchService;
    private final UserService userService;

    public CommentController(CommentRepository commentRepo, MatchService matchService, UserService userService) {
        this.commentRepo = commentRepo;
        this.matchService = matchService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));

        String content = (String) body.get("content");
        if (content == null || content.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Comment cannot be empty"));
        if (content.length() > 1000)
            return ResponseEntity.badRequest().body(Map.of("error", "Comment too long (max 1000 chars)"));

        Long matchId = Long.valueOf(body.get("matchId").toString());
        try {
            User user = userService.findById(userId);
            Match match = matchService.getById(matchId);
            Comment comment = new Comment();
            comment.setUser(user);
            comment.setMatch(match);
            comment.setContent(content.trim());
            comment = commentRepo.save(comment);
            return ResponseEntity.ok(Map.of(
                    "id", comment.getId(),
                    "username", user.getUsername(),
                    "matchId", matchId,
                    "content", comment.getContent(),
                    "createdAt", comment.getCreatedAt().toString()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/match/{matchId}")
    public ResponseEntity<?> getByMatch(@PathVariable Long matchId) {
        try {
            Match match = matchService.getById(matchId);
            List<Comment> comments = commentRepo.findByMatchOrderByCreatedAtDesc(match);
            List<Map<String, Object>> result = comments.stream().map(c -> Map.<String, Object>of(
                    "id", c.getId(),
                    "username", c.getUser().getUsername(),
                    "content", c.getContent(),
                    "createdAt", c.getCreatedAt().toString()
            )).toList();
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
