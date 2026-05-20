package com.sportspredictor.controller;

import com.sportspredictor.dto.PredictionRequest;
import com.sportspredictor.model.Match;
import com.sportspredictor.model.Prediction;
import com.sportspredictor.model.User;
import com.sportspredictor.service.MatchService;
import com.sportspredictor.service.PredictionService;
import com.sportspredictor.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/predictions")
public class PredictionController {

    private final PredictionService predService;
    private final MatchService matchService;
    private final UserService userService;

    public PredictionController(PredictionService predService, MatchService matchService, UserService userService) {
        this.predService = predService;
        this.matchService = matchService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<?> predict(@Valid @RequestBody PredictionRequest req, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));

        try {
            User user = userService.findById(userId);
            Match match = matchService.getById(req.getMatchId());
            Prediction pred = predService.upsert(user, match, req.getPredictedWinner());
            return ResponseEntity.ok(Map.of(
                    "id", pred.getId(),
                    "matchId", match.getId(),
                    "predictedWinner", pred.getPredictedWinner()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/match/{matchId}")
    public ResponseEntity<?> stats(@PathVariable Long matchId, HttpSession session) {
        try {
            Match match = matchService.getById(matchId);
            Long userId = (Long) session.getAttribute("userId");
            return ResponseEntity.ok(predService.getStats(match, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> userPredictions(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        User user = userService.findById(userId);
        return ResponseEntity.ok(predService.getUserPredictions(user));
    }
}
