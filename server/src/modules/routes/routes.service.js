import { query } from "../../config/db.js";

// Shared column list: converts geography back to plain lat/lng numbers
// and the polyline to WKT text the client can parse.
const ROUTE_COLUMNS = `
  id, user_id, city_id,
  ST_Y(origin::geometry) AS origin_lat,
  ST_X(origin::geometry) AS origin_lng,
  origin_address,
  ST_Y(destination::geometry) AS dest_lat,
  ST_X(destination::geometry) AS dest_lng,
  dest_address,
  ST_AsText(route_polyline) AS polyline_wkt,
  distance_km, duration_min, type, role, vehicle_id,
  available_seats, departure_time, departure_date, departure_at,
  time_flex_min, recurring_days, is_active, expires_at,
  created_at, updated_at`;

const getByUserId = async (userId) => {
  const result = await query(
    `SELECT ${ROUTE_COLUMNS} FROM routes WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
};

const getById = async (id, userId) => {
  const result = await query(
    `SELECT ${ROUTE_COLUMNS} FROM routes WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rows[0] || null;
};

const create = async (userId, data) => {
  // If client doesn't send distance/duration, DB estimates them:
  // distance = straight-line origin→destination in km,
  // duration = distance at ~28 km/h average city speed.
  const result = await query(
    `INSERT INTO routes
      (user_id, city_id, origin, origin_address, destination, dest_address,
       route_polyline, distance_km, duration_min, type, role, vehicle_id,
       available_seats, departure_time, departure_date, departure_at,
       time_flex_min, recurring_days)
    VALUES (
      $1, $2,
      ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
      $5,
      ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
      $8,
      CASE WHEN $9::text IS NOT NULL THEN ST_GeomFromText($9::text, 4326)::geography ELSE NULL END,
      COALESCE($10, ROUND((ST_Distance(
        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
        ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography
      ) / 1000.0)::numeric, 2)),
      COALESCE($11, GREATEST(1, CEIL((ST_Distance(
        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
        ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography
      ) / 1000.0) / 28.0 * 60.0)::int)),
      $12, $13, $14, $15, $16, $17, $18, $19, $20
    )
    RETURNING *`,
    [
      userId,
      data.cityId || null,
      data.originLng, data.originLat,           // lng first!
      data.originAddress || null,
      data.destLng, data.destLat,
      data.destAddress || null,
      data.polylineWkt || null,                 // "LINESTRING(lng lat, lng lat, ...)"
      data.distanceKm || null,
      data.durationMin || null,
      data.type,                                // recurring | one_time | instant
      data.role,                                // driver | rider
      data.vehicleId || null,
      data.availableSeats || 1,
      data.departureTime || null,
      data.departureDate || null,
      data.departureAt || null,
      data.timeFlexMin || 15,
      data.recurringDays || [],                 // [1,2,3,4,5] = Mon–Fri
    ],
  );
  return result.rows[0];
};

const update = async (id, userId, data) => {
  const result = await query(
    `UPDATE routes SET
      origin_address  = COALESCE($3, origin_address),
      dest_address    = COALESCE($4, dest_address),
      departure_time  = COALESCE($5, departure_time),
      departure_date  = COALESCE($6, departure_date),
      available_seats = COALESCE($7, available_seats),
      time_flex_min   = COALESCE($8, time_flex_min),
      recurring_days  = COALESCE($9, recurring_days),
      is_active       = COALESCE($10, is_active),
      updated_at      = NOW()
    WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, data.originAddress, data.destAddress, data.departureTime,
     data.departureDate, data.availableSeats, data.timeFlexMin,
     data.recurringDays, data.isActive],
  );
  return result.rows[0] || null;
};

// BUG FIX: original did a hard DELETE (while the API message said
// "deactivated"!). Hard delete also crashes with a foreign-key error
// once any ride/gps_trace references the route. Soft-delete instead:
const remove = async (id, userId) => {
  const result = await query(
    `UPDATE routes SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId],
  );
  return result.rows[0] || null;
};

export { getByUserId, getById, create, update, remove };
