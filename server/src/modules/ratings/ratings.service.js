import { getClient, query } from "../../config/db.js";
import { AppError } from "../../utils/helpers.js";

const createRating = async (fromUserId, data) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const rideRes = await client.query(
      `SELECT id, driver_id, status
       FROM rides
       WHERE id = $1`,
      [data.rideId],
    );
    const ride = rideRes.rows[0];
    if (!ride) throw new AppError("Ride not found", 404);
    if (ride.status !== "completed") {
      throw new AppError("Ride must be completed before rating", 400);
    }

    if (data.toUserId === fromUserId) {
      throw new AppError("You cannot rate yourself", 400);
    }

    const participationRes = await client.query(
      `SELECT 1
       FROM rides r
       LEFT JOIN ride_participants rp ON rp.ride_id = r.id
       WHERE r.id = $1
         AND (
           r.driver_id = $2
           OR rp.rider_id = $2
         )
       LIMIT 1`,
      [data.rideId, fromUserId],
    );
    if (!participationRes.rows[0]) {
      throw new AppError("You did not participate in this ride", 403);
    }

    const targetParticipationRes = await client.query(
      `SELECT 1
       FROM rides r
       LEFT JOIN ride_participants rp ON rp.ride_id = r.id
       WHERE r.id = $1
         AND (
           r.driver_id = $2
           OR rp.rider_id = $2
         )
       LIMIT 1`,
      [data.rideId, data.toUserId],
    );
    if (!targetParticipationRes.rows[0]) {
      throw new AppError("Rated user did not participate in this ride", 400);
    }

    const ratingRes = await client.query(
      `INSERT INTO ratings (ride_id, from_user, to_user, score, review, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.rideId,
        fromUserId,
        data.toUserId,
        data.score,
        data.review || null,
        data.tags || [],
      ],
    );

    const aggregateRes = await client.query(
      `SELECT
         COALESCE(AVG(score), 5.0)::numeric(3,2) AS rating_avg,
         COUNT(*)::int AS rating_count
       FROM ratings
       WHERE to_user = $1`,
      [data.toUserId],
    );

    await client.query(
      `UPDATE users
       SET rating_avg = $2,
           rating_count = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [
        data.toUserId,
        aggregateRes.rows[0].rating_avg,
        aggregateRes.rows[0].rating_count,
      ],
    );

    await client.query("COMMIT");
    return ratingRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    if (error?.code === "23505") {
      throw new AppError("You already rated this user for this ride", 409);
    }
    throw error;
  } finally {
    client.release();
  }
};

const getMyReceivedRatings = async (userId, { limit = 50 } = {}) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const result = await query(
    `SELECT
       r.*,
       u.full_name AS from_user_name,
       u.avatar_url AS from_user_avatar
     FROM ratings r
     LEFT JOIN users u ON u.id = r.from_user
     WHERE r.to_user = $1
     ORDER BY r.created_at DESC
     LIMIT $2`,
    [userId, safeLimit],
  );

  return result.rows;
};

const getMyGivenRatings = async (userId, { limit = 50 } = {}) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const result = await query(
    `SELECT
       r.*,
       u.full_name AS to_user_name,
       u.avatar_url AS to_user_avatar
     FROM ratings r
     LEFT JOIN users u ON u.id = r.to_user
     WHERE r.from_user = $1
     ORDER BY r.created_at DESC
     LIMIT $2`,
    [userId, safeLimit],
  );

  return result.rows;
};

export { createRating, getMyReceivedRatings, getMyGivenRatings };
