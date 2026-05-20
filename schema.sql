-- Sports Predictor PostgreSQL Schema

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE sport_type AS ENUM ('FOOTBALL', 'UFC', 'TENNIS');
CREATE TYPE match_status AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED');

CREATE TABLE matches (
    id             BIGSERIAL PRIMARY KEY,
    sport          sport_type NOT NULL,
    contestant1    VARCHAR(100) NOT NULL,
    contestant2    VARCHAR(100) NOT NULL,
    scheduled_at   TIMESTAMP NOT NULL,
    status         match_status DEFAULT 'UPCOMING',
    result         VARCHAR(100),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE predictions (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id          BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    predicted_winner  VARCHAR(20) NOT NULL CHECK (predicted_winner IN ('CONTESTANT1', 'CONTESTANT2')),
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, match_id)
);

CREATE TABLE comments (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id   BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_comments_match    ON comments(match_id);
CREATE INDEX idx_matches_sport     ON matches(sport, status);

-- Sample data
INSERT INTO matches (sport, contestant1, contestant2, scheduled_at) VALUES
  ('FOOTBALL', 'Manchester City',  'Arsenal',         NOW() + INTERVAL '2 days'),
  ('FOOTBALL', 'Real Madrid',      'Barcelona',       NOW() + INTERVAL '3 days'),
  ('FOOTBALL', 'PSG',              'Bayern Munich',   NOW() + INTERVAL '5 days'),
  ('UFC',      'Jon Jones',        'Stipe Miocic',    NOW() + INTERVAL '4 days'),
  ('UFC',      'Islam Makhachev',  'Dustin Poirier',  NOW() + INTERVAL '7 days'),
  ('TENNIS',   'Novak Djokovic',   'Carlos Alcaraz',  NOW() + INTERVAL '1 day'),
  ('TENNIS',   'Iga Swiatek',      'Aryna Sabalenka', NOW() + INTERVAL '6 days');
