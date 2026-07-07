CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE cities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    state       VARCHAR(100),
    country     VARCHAR(50) DEFAULT 'India',
    boundary    GEOGRAPHY(POLYGON, 4326),
    is_active   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);