CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(30) NOT NULL,
    title       VARCHAR(200),
    body        TEXT,
    data        JSONB DEFAULT '{}'::jsonb,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);