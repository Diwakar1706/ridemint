CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type    VARCHAR(20) CHECK (vehicle_type IN ('car', 'suv', 'bike', 'auto')),
    make            VARCHAR(50),
    model           VARCHAR(50),
    color           VARCHAR(30),
    license_plate   VARCHAR(20),
    total_seats     INT NOT NULL CHECK (total_seats BETWEEN 1 AND 7),
    has_ac          BOOLEAN DEFAULT TRUE,
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);