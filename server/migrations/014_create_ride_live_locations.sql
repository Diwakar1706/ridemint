CREATE TABLE ride_live_locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id     UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location    GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy_m  DECIMAL(8,2),
    speed_kmph  DECIMAL(8,2),
    heading_deg DECIMAL(8,2),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ride_id, user_id)
);

CREATE INDEX idx_ride_live_locations_ride_id ON ride_live_locations(ride_id);
CREATE INDEX idx_ride_live_locations_updated_at ON ride_live_locations(updated_at DESC);