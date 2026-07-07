CREATE TABLE pool_groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100),
    city_id     UUID REFERENCES cities(id),
    corridor    GEOGRAPHY(LINESTRING, 4326),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pool_group_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID REFERENCES pool_groups(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    role        route_role NOT NULL,
    joined_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);