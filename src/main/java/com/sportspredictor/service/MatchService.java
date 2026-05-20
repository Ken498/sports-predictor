package com.sportspredictor.service;

import com.sportspredictor.model.Match;
import com.sportspredictor.repository.MatchRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MatchService {

    private final MatchRepository matchRepo;

    public MatchService(MatchRepository matchRepo) {
        this.matchRepo = matchRepo;
    }

    public List<Match> getAll(String sport) {
        if (sport == null || sport.isBlank()) {
            return matchRepo.findAllByOrderByScheduledAtAsc();
        }
        return matchRepo.findBySportOrderByScheduledAtAsc(Match.Sport.valueOf(sport.toUpperCase()));
    }

    public Match getById(Long id) {
        return matchRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));
    }
}
