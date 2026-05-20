package com.sportspredictor.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
public class Match {

    public enum Sport { FOOTBALL, UFC, TENNIS }
    public enum Status { UPCOMING, LIVE, COMPLETED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sport sport;

    @Column(nullable = false)
    private String contestant1;

    @Column(nullable = false)
    private String contestant2;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    private Status status = Status.UPCOMING;

    private String result;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Sport getSport() { return sport; }
    public void setSport(Sport sport) { this.sport = sport; }
    public String getContestant1() { return contestant1; }
    public void setContestant1(String c) { this.contestant1 = c; }
    public String getContestant2() { return contestant2; }
    public void setContestant2(String c) { this.contestant2 = c; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime t) { this.scheduledAt = t; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
}
