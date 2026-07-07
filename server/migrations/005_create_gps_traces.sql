CREATE TABLE gps_traces (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    route_id    UUID REFERENCES routes(id),
    trace       GEOGRAPHY(LINESTRING, 4326) NOT NULL,
    started_at  TIMESTAMPTZ NOT NULL,
    ended_at    TIMESTAMPTZ NOT NULL,
    distance_km DECIMAL(8,2),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);