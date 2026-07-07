CREATE TYPE route_type AS ENUM ('recurring', 'one_time', 'instant');
CREATE TYPE route_role AS ENUM ('driver', 'rider');

CREATE TABLE routes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    city_id         UUID REFERENCES cities(id),
    origin          GEOGRAPHY(POINT, 4326) NOT NULL,
    origin_address  TEXT,
    destination     GEOGRAPHY(POINT, 4326) NOT NULL,
    dest_address    TEXT,
    route_polyline  GEOGRAPHY(LINESTRING, 4326),
    distance_km     DECIMAL(8,2),
    duration_min    INT,
    type            route_type NOT NULL,
    role            route_role NOT NULL,
    vehicle_id      UUID REFERENCES vehicles(id),
    available_seats INT DEFAULT 1,
    departure_time  TIME,
    departure_date  DATE,
    departure_at    TIMESTAMPTZ,
    time_flex_min   INT DEFAULT 15,
    recurring_days  INT[] DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    expires_at      TIMESTAMPTZ,
    is_gps_learned  BOOLEAN DEFAULT FALSE,
    gps_trace_count INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routes_polyline ON routes USING GIST (route_polyline);
CREATE INDEX idx_routes_origin ON routes USING GIST (origin);
CREATE INDEX idx_routes_destination ON routes USING GIST (destination);
CREATE INDEX idx_routes_active ON routes (is_active, city_id, type);