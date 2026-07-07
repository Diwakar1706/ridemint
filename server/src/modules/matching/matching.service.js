import { query } from "../../config/db.js";

const findMatches = async (userId, criteria) => {
  const {
    originLat, originLng, destLat, destLng,
    departureTime, type, role,
    timeFlexMin = 15,
    recurringDays = [],
    maxOriginDistanceMeters = 500,
    maxDestDistanceMeters = 500,
  } = criteria;

  // Drivers match riders and vice versa — you never match your own role
  const oppositeRole = role === "driver" ? "rider" : "driver";

  const result = await query(
    `
    SELECT
      r.id, r.user_id, r.type, r.role, r.available_seats,
      r.departure_time, r.distance_km, r.duration_min,
      r.time_flex_min, r.recurring_days,
      -- how far their start/end is from mine, in meters
      ST_Distance(ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, r.origin)      AS origin_distance_meters,
      ST_Distance(ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, r.destination) AS dest_distance_meters,
      ROUND(((
        ST_Distance(ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, r.origin) +
        ST_Distance(ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, r.destination)
      ) / 1000.0)::numeric, 2) AS overlap_detour_km,
      GREATEST(2, CEIL(((
        ST_Distance(ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, r.origin) +
        ST_Distance(ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, r.destination)
      ) / 1000.0) / 26.0 * 60.0)::int) AS estimated_eta_min,
      ABS(EXTRACT(EPOCH FROM (r.departure_time - $6::time)) / 60) AS time_diff_minutes,
      -- who they are + what they drive (shown on the match card)
      u.full_name, u.avatar_url, u.rating_avg, u.rating_count,
      v.make, v.model, v.color, v.license_plate
    FROM routes r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN vehicles v ON v.id = r.vehicle_id
    WHERE
      r.user_id != $1                -- never match yourself
      AND r.is_active = true
      AND r.type = $7                -- recurring matches recurring, etc.
      AND r.role = $8                -- the OPPOSITE role
      -- THE spatial core: their origin within X meters of mine,
      -- their destination within X meters of mine.
      -- ST_DWithin uses the GIST index from migration 004 — fast.
      AND ST_DWithin(ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, r.origin, $9)
      AND ST_DWithin(ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, r.destination, $10)
      -- time windows overlap: [my time ± my flex] ∩ [their time ± their flex] ≠ ∅
      AND (($6::time - ($11 * INTERVAL '1 minute')) <= (r.departure_time + (r.time_flex_min * INTERVAL '1 minute')))
      AND (($6::time + ($11 * INTERVAL '1 minute')) >= (r.departure_time - (r.time_flex_min * INTERVAL '1 minute')))
      -- recurring routes must share at least one weekday (&& = arrays overlap)
      AND ($7 != 'recurring' OR ($12::int[] && r.recurring_days))
      -- drivers must have a free seat
      AND (r.role != 'driver' OR r.available_seats > 0)
    ORDER BY (
      ST_Distance(ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, r.origin) +
      ST_Distance(ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, r.destination)
    ) ASC                            -- closest combined pickup+dropoff first
    LIMIT 20
    `,
    [userId, originLng, originLat, destLng, destLat, departureTime,
     type, oppositeRole, maxOriginDistanceMeters, maxDestDistanceMeters,
     timeFlexMin, recurringDays],
  );
  return result.rows;
};

const getMatchAlerts = async (userId) => {
  const result = await query(
    `SELECT mas.id, mas.user_id, mas.route_id, mas.is_enabled,
            mas.created_at, mas.updated_at,
            r.origin_address, r.dest_address, r.departure_time, r.type, r.role
     FROM match_alert_subscriptions mas
     LEFT JOIN routes r ON r.id = mas.route_id
     WHERE mas.user_id = $1
     ORDER BY mas.created_at DESC`,
    [userId],
  );
  return result.rows;
};

// "Alert me when someone matching this route appears."
// ON CONFLICT = upsert: one subscription per (user, route), toggled in place.
const upsertMatchAlert = async (userId, payload) => {
  const owns = await query(
    "SELECT id FROM routes WHERE id = $1 AND user_id = $2",
    [payload.routeId, userId],
  );
  if (!owns.rows.length) return null;

  const result = await query(
    `INSERT INTO match_alert_subscriptions (user_id, route_id, is_enabled)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, route_id)
     DO UPDATE SET is_enabled = EXCLUDED.is_enabled, updated_at = NOW()
     RETURNING id, user_id, route_id, is_enabled, created_at, updated_at`,
    [userId, payload.routeId, payload.isEnabled !== false],
  );
  return result.rows[0] || null;
};

export { findMatches, getMatchAlerts, upsertMatchAlert };
