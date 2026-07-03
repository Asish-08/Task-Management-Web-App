CREATE TABLE IF NOT EXISTS folders (
    id         SERIAL PRIMARY KEY,
    name       TEXT        NOT NULL DEFAULT 'Untitled Folder',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    emptied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS folder_id INTEGER
        REFERENCES folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_folder_id
    ON tasks (folder_id)
    WHERE folder_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_folders_emptied_at
    ON folders (emptied_at);
