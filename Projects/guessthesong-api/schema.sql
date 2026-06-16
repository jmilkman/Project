CREATE TABLE IF NOT EXISTS leaderboard (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL CHECK(length(username) BETWEEN 1 AND 24),
    score       INTEGER NOT NULL CHECK(score BETWEEN 0 AND 1000),
    song_name   TEXT    NOT NULL,
    artist_name TEXT    NOT NULL,
    attempts    INTEGER NOT NULL CHECK(attempts BETWEEN 1 AND 5),
    time_ms     INTEGER NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_score ON leaderboard(score DESC, created_at ASC);
