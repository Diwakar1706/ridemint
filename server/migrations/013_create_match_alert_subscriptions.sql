CREATE TABLE match_alert_subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route_id    UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, route_id)
);

CREATE INDEX idx_match_alert_subscriptions_user_id ON match_alert_subscriptions(user_id);
CREATE INDEX idx_match_alert_subscriptions_route_id ON match_alert_subscriptions(route_id);