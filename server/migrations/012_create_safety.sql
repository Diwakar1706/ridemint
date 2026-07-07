CREATE TABLE emergency_contacts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100),
    phone       VARCHAR(15) NOT NULL,
    relation    VARCHAR(50),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sos_alerts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id     UUID REFERENCES rides(id),
    user_id     UUID REFERENCES users(id),
    location    GEOGRAPHY(POINT, 4326),
    status      VARCHAR(20) DEFAULT 'active',
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);