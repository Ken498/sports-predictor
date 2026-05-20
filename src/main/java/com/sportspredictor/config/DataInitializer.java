package com.sportspredictor.config;

import com.sportspredictor.model.Match;
import com.sportspredictor.repository.MatchRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final MatchRepository matchRepo;

    public DataInitializer(MatchRepository matchRepo) {
        this.matchRepo = matchRepo;
    }

    @Override
    public void run(String... args) {
        if (matchRepo.count() > 0) return;

        LocalDateTime now = LocalDateTime.now();
        matchRepo.save(match(Match.Sport.FOOTBALL, "Manchester City", "Arsenal",        now.plusDays(2)));
        matchRepo.save(match(Match.Sport.FOOTBALL, "Real Madrid",     "Barcelona",      now.plusDays(3)));
        matchRepo.save(match(Match.Sport.FOOTBALL, "PSG",             "Bayern Munich",  now.plusDays(5)));
        matchRepo.save(match(Match.Sport.UFC,      "Jon Jones",       "Stipe Miocic",   now.plusDays(4)));
        matchRepo.save(match(Match.Sport.UFC,      "Islam Makhachev", "Dustin Poirier", now.plusDays(7)));
        matchRepo.save(match(Match.Sport.TENNIS,   "Novak Djokovic",  "Carlos Alcaraz", now.plusDays(1)));
        matchRepo.save(match(Match.Sport.TENNIS,   "Iga Swiatek",     "Aryna Sabalenka",now.plusDays(6)));
    }

    private Match match(Match.Sport sport, String c1, String c2, LocalDateTime when) {
        Match m = new Match();
        m.setSport(sport);
        m.setContestant1(c1);
        m.setContestant2(c2);
        m.setScheduledAt(when);
        return m;
    }
}
