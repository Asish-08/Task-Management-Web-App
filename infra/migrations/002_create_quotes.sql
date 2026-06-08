CREATE TABLE IF NOT EXISTS quotes (
    id     SERIAL PRIMARY KEY,
    text   TEXT         NOT NULL,
    author VARCHAR(100)
);
