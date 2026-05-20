package com.sportspredictor.repository;

import com.sportspredictor.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findBySportOrderByScheduledAtAsc(Match.Sport sport);
    List<Match> findByStatusOrderByScheduledAtAsc(Match.Status status);
    List<Match> findAllByOrderByScheduledAtAsc();
}
