CREATE TYPE ride_status AS ENUM (
    'requested', 'accepted', 'driver_arriving',
    'in_progress', 'completed', 'cancelled'
);

CREATE TABLE rides (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id       UUID REFERENCES users(id),
    vehicle_id      UUID REFERENCES vehicles(id),
    route_id        UUID REFERENCES routes(id),
    status          ride_status DEFAULT 'requested',
    actual_start    TIMESTAMPTZ,
    actual_end      TIMESTAMPTZ,
    actual_polyline GEOGRAPHY(LINESTRING, 4326),
    actual_distance DECIMAL(8,2),
    total_fare      DECIMAL(10,2),
    driver_earning  DECIMAL(10,2),
    platform_fee    DECIMAL(10,2),
    co2_saved_kg    DECIMAL(6,2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);