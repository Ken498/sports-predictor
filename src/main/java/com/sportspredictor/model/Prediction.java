package com.sportspredictor.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "match_id"}))
public class Prediction {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Column(nullable = false)
    private String predictedWinner; // "CONTESTANT1" or "CONTESTANT2"

    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Match getMatch() { return match; }
    public void setMatch(Match match) { this.match = match; }
    public String getPredictedWinner() { return predictedWinner; }
    public void setPredictedWinner(String pw) { this.predictedWinner = pw; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
