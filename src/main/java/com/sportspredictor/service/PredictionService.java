package com.sportspredictor.service;

import com.sportspredictor.model.Match;
import com.sportspredictor.model.Prediction;
import com.sportspredictor.model.User;
import com.sportspredictor.repository.PredictionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PredictionService {

    private final PredictionRepository predRepo;

    public PredictionService(PredictionRepository predRepo) {
        this.predRepo = predRepo;
    }

    @Transactional
    public Prediction upsert(User user, Match match, String predictedWinner) {
        Optional<Prediction> existing = predRepo.findByUserAndMatch(user, match);
        Prediction pred = existing.orElseGet(Prediction::new);
        pred.setUser(user);
        pred.setMatch(match);
        pred.setPredictedWinner(predictedWinner);
        return predRepo.save(pred);
    }

    public Map<String, Object> getStats(Match match, Long currentUserId) {
        List<Prediction> all = predRepo.findByMatch(match);
        long total = all.size();
        long c1 = all.stream().filter(p -> "CONTESTANT1".equals(p.getPredictedWinner())).count();
        long c2 = total - c1;

        String userPick = null;
        if (currentUserId != null) {
            userPick = all.stream()
                    .filter(p -> p.getUser().getId().equals(currentUserId))
                    .map(Prediction::getPredictedWinner)
                    .findFirst().orElse(null);
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("contestant1Percent", total == 0 ? 0 : Math.round(c1 * 100.0 / total));
        stats.put("contestant2Percent", total == 0 ? 0 : Math.round(c2 * 100.0 / total));
        stats.put("contestant1Name", match.getContestant1());
        stats.put("contestant2Name", match.getContestant2());
        stats.put("userPrediction", userPick);
        return stats;
    }

    public List<Prediction> getUserPredictions(User user) {
        return predRepo.findByUser(user);
    }
}
