package com.sportspredictor.controller;

import com.sportspredictor.dto.LoginRequest;
import com.sportspredictor.dto.RegisterRequest;
import com.sportspredictor.model.User;
import com.sportspredictor.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String SESSION_USER_ID = "userId";

    private final UserService userService;
    private final PasswordEncoder encoder;

    public AuthController(UserService userService, PasswordEncoder encoder) {
        this.userService = userService;
        this.encoder = encoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req, HttpSession session) {
        try {
            User user = userService.register(req);
            session.setAttribute(SESSION_USER_ID, user.getId());
            return ResponseEntity.ok(userView(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpSession session) {
        try {
            User user = userService.findByEmail(req.getEmail());
            if (!encoder.matches(req.getPassword(), user.getPassword())) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }
            session.setAttribute(SESSION_USER_ID, user.getId());
            return ResponseEntity.ok(userView(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Long userId = (Long) session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        try {
            return ResponseEntity.ok(userView(userService.findById(userId)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Session expired"));
        }
    }

    private Map<String, Object> userView(User u) {
        return Map.of("id", u.getId(), "username", u.getUsername(), "email", u.getEmail());
    }
}
