CREATE TYPE payment_status AS ENUM (
    'pending', 'processing', 'completed', 'failed', 'refunded'
);

CREATE TABLE wallets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance     DECIMAL(10,2) DEFAULT 0.00,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id       UUID REFERENCES wallets(id),
    ride_id         UUID REFERENCES rides(id),
    type            VARCHAR(20) CHECK (type IN (
                        'ride_payment', 'ride_earning', 'topup',
                        'withdrawal', 'refund', 'platform_fee'
                    )),
    amount          DECIMAL(10,2) NOT NULL,
    status          payment_status DEFAULT 'pending',
    pg_provider     VARCHAR(20),
    pg_reference_id VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);