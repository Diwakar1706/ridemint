import { query } from "../../config/db.js";

const getByUserId = async (userId) => {
  const result = await query(
    "SELECT * FROM vehicles WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
    [userId],
  );
  return result.rows;
};

const create = async (userId, data) => {
  const result = await query(
    `INSERT INTO vehicles
      (user_id, vehicle_type, make, model, color, license_plate, total_seats, has_ac)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      userId,
      data.vehicleType,
      data.make,
      data.model,
      data.color,
      data.licensePlate,
      data.totalSeats,
      data.hasAc ?? true, // BUG FIX: undefined would insert NULL, bypassing the column's DEFAULT TRUE
    ],
  );
  return result.rows[0];
};

const update = async (id, userId, data) => {
  const result = await query(
    `UPDATE vehicles SET
      vehicle_type  = COALESCE($3, vehicle_type),
      make          = COALESCE($4, make),
      model         = COALESCE($5, model),
      color         = COALESCE($6, color),
      license_plate = COALESCE($7, license_plate),
      total_seats   = COALESCE($8, total_seats),
      has_ac        = COALESCE($9, has_ac),
      is_default    = COALESCE($10, is_default)
    WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, data.vehicleType, data.make, data.model, data.color,
     data.licensePlate, data.totalSeats, data.hasAc, data.isDefault],
  );
  return result.rows[0] || null;
};

const remove = async (id, userId) => {
  const result = await query(
    "DELETE FROM vehicles WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, userId],
  );
  return result.rows[0] || null;
};

export { getByUserId, create, update, remove };
