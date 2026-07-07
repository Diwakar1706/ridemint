CREATE TABLE ratings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id     UUID REFERENCES rides(id),
    from_user   UUID REFERENCES users(id),
    to_user     UUID REFERENCES users(id),
    score       INT CHECK (score BETWEEN 1 AND 5),
    review      TEXT,
    tags        TEXT[],
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ride_id, from_user, to_user)
);