import { query } from "../../config/db.js";
import { emitToUser } from "./socket.handler.js";

const createNotification = async ({ userId, type, title, body, data = {} }) => {
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *`,
    [userId, type, title || null, body || null, JSON.stringify(data)],
  );

  const notification = result.rows[0];
  emitToUser(userId, "notification:new", notification);
  return notification;
};

const getMyNotifications = async (
  userId,
  { limit = 50, unreadOnly = false },
) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));

  const result = await query(
    `SELECT *
     FROM notifications
     WHERE user_id = $1
       AND ($2::boolean = false OR is_read = false)
     ORDER BY created_at DESC
     LIMIT $3`,
    [userId, unreadOnly, safeLimit],
  );

  return result.rows;
};

const markAsRead = async (notificationId, userId) => {
  const result = await query(
    `UPDATE notifications
     SET is_read = true
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId],
  );

  return result.rows[0] || null;
};

const markAllAsRead = async (userId) => {
  const result = await query(
    `UPDATE notifications
     SET is_read = true
     WHERE user_id = $1 AND is_read = false
     RETURNING id`,
    [userId],
  );

  return { updatedCount: result.rowCount || 0 };
};

export { createNotification, getMyNotifications, markAsRead, markAllAsRead };
