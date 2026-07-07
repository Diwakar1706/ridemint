import { query } from "../../config/db.js";

const getEmergencyContacts = async (userId) => {
  const result = await query(
    `SELECT *
     FROM emergency_contacts
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
};

const addEmergencyContact = async (userId, data) => {
  const result = await query(
    `INSERT INTO emergency_contacts (user_id, name, phone, relation)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, data.name || null, data.phone, data.relation || null],
  );
  return result.rows[0];
};

const removeEmergencyContact = async (contactId, userId) => {
  const result = await query(
    `DELETE FROM emergency_contacts
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [contactId, userId],
  );
  return result.rows[0] || null;
};

const triggerSos = async (userId, data) => {
  const result = await query(
    `INSERT INTO sos_alerts (ride_id, user_id, location, status)
     VALUES (
      $1,
      $2,
      ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
      'active'
     )
     RETURNING
      id,
      ride_id,
      user_id,
      status,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      resolved_at,
      created_at`,
    [data.rideId || null, userId, data.lng, data.lat],
  );
  return result.rows[0];
};

const resolveSos = async (sosId, userId) => {
  const result = await query(
    `UPDATE sos_alerts
     SET status = 'resolved',
         resolved_at = NOW()
     WHERE id = $1
       AND user_id = $2
       AND status = 'active'
     RETURNING
      id,
      ride_id,
      user_id,
      status,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      resolved_at,
      created_at`,
    [sosId, userId],
  );
  return result.rows[0] || null;
};

const getMySosAlerts = async (userId, { status } = {}) => {
  const result = await query(
    `SELECT
      id,
      ride_id,
      user_id,
      status,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      resolved_at,
      created_at
     FROM sos_alerts
     WHERE user_id = $1
       AND ($2::text IS NULL OR status = $2)
     ORDER BY created_at DESC`,
    [userId, status || null],
  );
  return result.rows;
};

export {
  getEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
  triggerSos,
  resolveSos,
  getMySosAlerts,
};
