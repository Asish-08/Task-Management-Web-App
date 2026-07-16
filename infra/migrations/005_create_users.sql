CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        TEXT        NOT NULL,
    hashed_password TEXT        NOT NULL,
    email           TEXT,
    name            TEXT,
    bio             TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive uniqueness on the login identifier.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username));

-- Case-insensitive uniqueness on email, scoped to non-null so the transient
-- pre-profile-setup NULL state (before the user fills in their email) never
-- conflicts with itself across accounts.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email)) WHERE email IS NOT NULL;

-- Nullable on purpose: pre-existing rows keep user_id = NULL until a one-time
-- backfill is run manually against production after the first account is
-- created. Do NOT add a NOT NULL constraint here.
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS user_id INTEGER
        REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE folders
    ADD COLUMN IF NOT EXISTS user_id INTEGER
        REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_user_id
    ON tasks (user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_folders_user_id
    ON folders (user_id)
    WHERE user_id IS NOT NULL;
