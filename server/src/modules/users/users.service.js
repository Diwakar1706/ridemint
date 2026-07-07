import { query } from "../../config/db.js";

// Full private profile — for the user themselves.
// PostGIS stores POINTs as binary; ST_Y/ST_X extract lat/lng back out.
const getById = async (id) => {
  const result = await query(
    `SELECT id, phone, email, full_name, avatar_url, gender,
      ST_Y(home_location::geometry) AS home_lat,
      ST_X(home_location::geometry) AS home_lng,
      home_address,
      ST_Y(office_location::geometry) AS office_lat,
      ST_X(office_location::geometry) AS office_lng,
      office_address,
      default_role, preferences, is_phone_verified, is_email_verified,
      total_rides, total_co2_saved_kg, rating_avg, rating_count,
      city_id, created_at
    FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

const updateProfile = async (id, { fullName, email, gender, defaultRole, preferences }) => {
  const result = await query(
    `UPDATE users SET
      full_name    = COALESCE($2, full_name),
      email        = COALESCE($3, email),
      gender       = COALESCE($4, gender),
      default_role = COALESCE($5, default_role),
      preferences  = COALESCE($6, preferences),
      updated_at   = NOW()
    WHERE id = $1 RETURNING *`,
    [id, fullName, email, gender, defaultRole, preferences],
  );
  return result.rows[0];
};

// ST_MakePoint(lng, lat) — LONGITUDE FIRST. The #1 PostGIS mistake:
// it's (x, y) math convention, opposite of the "lat, lng" spoken order.
const updateLocations = async (id, { homeLat, homeLng, homeAddress, officeLat, officeLng, officeAddress }) => {
  const result = await query(
    `UPDATE users SET
      home_location = CASE WHEN $2::float IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography ELSE home_location END,
      home_address = COALESCE($4, home_address),
      office_location = CASE WHEN $5::float IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography ELSE office_location END,
      office_address = COALESCE($7, office_address),
      updated_at = NOW()
    WHERE id = $1 RETURNING *`,
    [id, homeLat, homeLng, homeAddress, officeLat, officeLng, officeAddress],
  );
  return result.rows[0];
};

// Public profile — what OTHER users see. No phone, email, or locations.
const getPublicProfile = async (id) => {
  const result = await query(
    `SELECT id, full_name, avatar_url, rating_avg, rating_count,
      total_rides, total_co2_saved_kg, created_at
    FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

export { getById, updateProfile, updateLocations, getPublicProfile };
