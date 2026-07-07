CREATE TABLE ride_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id         UUID REFERENCES rides(id) ON DELETE CASCADE,
    rider_id        UUID REFERENCES users(id),
    pickup_point    GEOGRAPHY(POINT, 4326),
    pickup_address  TEXT,
    dropoff_point   GEOGRAPHY(POINT, 4326),
    dropoff_address TEXT,
    segment_distance_km DECIMAL(8,2),
    fare_amount         DECIMAL(10,2),
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','picked_up',
                                      'dropped_off','cancelled','no_show')),
    picked_up_at    TIMESTAMPTZ,
    dropped_off_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);