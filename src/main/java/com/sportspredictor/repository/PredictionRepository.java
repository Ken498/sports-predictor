package com.sportspredictor.repository;

import com.sportspredictor.model.Match;
import com.sportspredictor.model.Prediction;
import com.sportspredictor.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    Optional<Prediction> findByUserAndMatch(User user, Match match);
    List<Prediction> findByMatch(Match match);
    List<Prediction> findByUser(User user);

    @Query("SELECT COUNT(p) FROM Prediction p WHERE p.match = :match AND p.predictedWinner = :winner")
    long countByMatchAndPredictedWinner(Match match, String winner);
}
