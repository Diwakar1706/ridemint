import { query } from "../../config/db.js";
import { AppError } from "../../utils/helpers.js";

const toOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const ensureRideAccess = async (rideId, userId) => {
  const accessResult = await query(
    `SELECT r.id
     FROM rides r
     WHERE r.id = $1
       AND (
         r.driver_id = $2
         OR EXISTS (
           SELECT 1
           FROM ride_participants rp
           WHERE rp.ride_id = r.id
             AND rp.rider_id = $2
         )
       )`,
    [rideId, userId],
  );

  if (!accessResult.rows.length) {
    throw new AppError("Ride not found", 404);
  }
};

const createRide = async (driverId, data) => {
  const result = await query(
    `INSERT INTO rides (driver_id, vehicle_id, route_id, status)
     VALUES ($1, $2, $3, 'requested')
     RETURNING *`,
    [driverId, data.vehicleId, data.routeId],
  );
  return result.rows[0];
};

const joinRide = async (rideId, riderId, data) => {
  const result = await query(
    `INSERT INTO ride_participants
      (ride_id, rider_id, pickup_point, pickup_address, dropoff_point, dropoff_address, segment_distance_km, fare_amount)
     VALUES
      (
        $1, $2,
        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
        $5,
        ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
        $8,
        COALESCE(
          $9,
          ROUND(
            (
              ST_Distance(
                ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
                ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography
              ) / 1000.0
            )::numeric,
            2
          )
        ),
        COALESCE(
          $10,
          ROUND(
            (
              COALESCE(
                $9,
                ST_Distance(
                  ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
                  ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography
                ) / 1000.0
              )
              * 8.5
            )::numeric,
            2
          )
        )
      )
     RETURNING *`,
    [
      rideId,
      riderId,
      data.pickupLng,
      data.pickupLat,
      data.pickupAddress || null,
      data.dropoffLng,
      data.dropoffLat,
      data.dropoffAddress || null,
      data.segmentDistanceKm || null,
      data.fareAmount || null,
    ],
  );
  return result.rows[0];
};

const createRideRequest = async (riderId, data) => {
  const driverRouteResult = await query(
    `SELECT id, user_id, vehicle_id, role, is_active
     FROM routes
     WHERE id = $1`,
    [data.driverRouteId],
  );

  const driverRoute = driverRouteResult.rows[0];
  if (!driverRoute) {
    throw new AppError("Driver route not found", 404);
  }

  if (driverRoute.role !== "driver" || !driverRoute.is_active) {
    throw new AppError("Route is not available for ride requests", 400);
  }

  if (driverRoute.user_id === riderId) {
    throw new AppError("You cannot request your own route", 400);
  }

  const existingRideResult = await query(
    `SELECT id
     FROM rides
     WHERE route_id = $1
       AND driver_id = $2
       AND status IN ('requested', 'accepted', 'driver_arriving', 'in_progress')
     ORDER BY created_at DESC
     LIMIT 1`,
    [driverRoute.id, driverRoute.user_id],
  );

  let ride = existingRideResult.rows[0];

  if (!ride) {
    ride = await createRide(driverRoute.user_id, {
      vehicleId: driverRoute.vehicle_id,
      routeId: driverRoute.id,
    });
  }

  // BUG FIX: same rider must not join the same ride twice (duplicate
  // fares/payments). If they already have a non-cancelled participant
  // row, return it instead of inserting another.
  const existingParticipant = await query(
    `SELECT * FROM ride_participants
     WHERE ride_id = $1 AND rider_id = $2 AND status != 'cancelled'
     LIMIT 1`,
    [ride.id, riderId],
  );
  if (existingParticipant.rows[0]) {
    const hydrated = await getRideById(ride.id, riderId);
    return {
      ride: hydrated || ride,
      participant: existingParticipant.rows[0],
      alreadyRequested: true,
    };
  }

  const participant = await joinRide(ride.id, riderId, {
    pickupLng: data.pickupLng,
    pickupLat: data.pickupLat,
    pickupAddress: data.pickupAddress,
    dropoffLng: data.dropoffLng,
    dropoffLat: data.dropoffLat,
    dropoffAddress: data.dropoffAddress,
    segmentDistanceKm: data.segmentDistanceKm,
    fareAmount: data.fareAmount,
  });

  const hydratedRide = await getRideById(ride.id, riderId);
  return {
    ride: hydratedRide || ride,
    participant,
  };
};

const getRideById = async (rideId, userId = null) => {
  const rideResult = await query(
    `SELECT
      r.*,
      u.full_name as driver_name,
      u.phone as driver_phone,
      u.rating_avg as driver_rating,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.color as vehicle_color,
      v.license_plate
    FROM rides r
    LEFT JOIN users u ON u.id = r.driver_id
    LEFT JOIN vehicles v ON v.id = r.vehicle_id
    WHERE r.id = $1
      AND (
        $2::text IS NULL
        OR r.driver_id::text = $2::text
        OR EXISTS (
          SELECT 1
          FROM ride_participants rp_scope
          WHERE rp_scope.ride_id = r.id
            AND rp_scope.rider_id::text = $2::text
        )
      )`,
    [rideId, userId],
  );

  const ride = rideResult.rows[0];
  if (!ride) return null;

  const participantsResult = await query(
    `SELECT
      rp.*,
      u.full_name as rider_name,
      u.phone as rider_phone
    FROM ride_participants rp
    LEFT JOIN users u ON u.id = rp.rider_id
    WHERE rp.ride_id = $1
    ORDER BY rp.created_at ASC`,
    [rideId],
  );

  return {
    ...ride,
    participants: participantsResult.rows,
  };
};

const updateRideStatus = async (rideId, driverId, status) => {
  const result = await query(
    `UPDATE rides
     SET
      status = $3::ride_status,
      actual_start = CASE WHEN $3::text = 'in_progress' THEN NOW() ELSE actual_start END,
      actual_end = CASE WHEN $3::text IN ('completed', 'cancelled') THEN NOW() ELSE actual_end END,
      updated_at = NOW()
     WHERE id = $1 AND driver_id = $2
     RETURNING *`,
    [rideId, driverId, status],
  );

  return result.rows[0] || null;
};

const getMyRides = async (userId, { status = null, role = null } = {}) => {
  const result = await query(
    `SELECT DISTINCT r.*
     FROM rides r
     LEFT JOIN ride_participants rp ON rp.ride_id = r.id
     WHERE
      (
        ($2::text IS NULL AND (r.driver_id = $1 OR rp.rider_id = $1))
        OR ($2::text = 'driver' AND r.driver_id = $1)
        OR ($2::text = 'rider' AND rp.rider_id = $1)
      )
      AND (
        $3::text IS NULL
        OR ($3::text = 'active' AND r.status IN ('requested', 'accepted', 'driver_arriving', 'in_progress'))
        OR ($3::text != 'active' AND r.status::text = $3::text)
      )
     ORDER BY r.created_at DESC`,
    [userId, role, status],
  );

  return result.rows;
};

const cancelRide = async (rideId, userId) => {
  const result = await query(
    `UPDATE rides r
     SET
      status = 'cancelled',
      actual_end = CASE WHEN r.actual_end IS NULL THEN NOW() ELSE r.actual_end END,
      updated_at = NOW()
     WHERE r.id = $1
       AND (
         r.driver_id = $2
         OR EXISTS (
           SELECT 1
           FROM ride_participants rp
           WHERE rp.ride_id = r.id
             AND rp.rider_id = $2
         )
       )
     RETURNING r.*`,
    [rideId, userId],
  );

  return result.rows[0] || null;
};

const updateParticipantStatus = async (
  rideId,
  participantId,
  driverId,
  status,
) => {
  const result = await query(
    `UPDATE ride_participants rp
     SET
      status = $4::text,
      picked_up_at = CASE
        WHEN $4::text = 'picked_up' THEN NOW()
        ELSE rp.picked_up_at
      END,
      dropped_off_at = CASE
        WHEN $4::text = 'dropped_off' THEN NOW()
        ELSE rp.dropped_off_at
      END
     FROM rides r
     WHERE rp.id = $2
       AND rp.ride_id = $1
       AND r.id = rp.ride_id
       AND r.driver_id = $3
     RETURNING rp.*`,
    [rideId, participantId, driverId, status],
  );

  return result.rows[0] || null;
};

const upsertLiveLocation = async (rideId, userId, payload) => {
  await ensureRideAccess(rideId, userId);

  const result = await query(
    `INSERT INTO ride_live_locations
      (ride_id, user_id, location, accuracy_m, speed_kmph, heading_deg)
    VALUES (
      $1,
      $2,
      ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
      $5,
      $6,
      $7
    )
    ON CONFLICT (ride_id, user_id)
    DO UPDATE SET
      location = EXCLUDED.location,
      accuracy_m = EXCLUDED.accuracy_m,
      speed_kmph = EXCLUDED.speed_kmph,
      heading_deg = EXCLUDED.heading_deg,
      updated_at = NOW()
    RETURNING
      id,
      ride_id,
      user_id,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      accuracy_m,
      speed_kmph,
      heading_deg,
      created_at,
      updated_at`,
    [
      rideId,
      userId,
      payload.lng,
      payload.lat,
      toOptionalNumber(payload.accuracy),
      toOptionalNumber(payload.speedKmph),
      toOptionalNumber(payload.heading),
    ],
  );

  return result.rows[0];
};

const getLiveLocations = async (rideId, userId, { maxAgeSec = 60 } = {}) => {
  await ensureRideAccess(rideId, userId);

  const parsedMaxAge = Number.parseInt(maxAgeSec, 10);
  const safeMaxAge = Number.isFinite(parsedMaxAge)
    ? Math.min(Math.max(parsedMaxAge, 5), 3600)
    : 60;

  const result = await query(
    `SELECT
      rll.id,
      rll.ride_id,
      rll.user_id,
      ST_Y(rll.location::geometry) AS lat,
      ST_X(rll.location::geometry) AS lng,
      rll.accuracy_m,
      rll.speed_kmph,
      rll.heading_deg,
      CASE
        WHEN rt.destination IS NULL THEN NULL
        ELSE ROUND((ST_Distance(rll.location, rt.destination) / 1000.0)::numeric, 2)
      END AS distance_to_destination_km,
      CASE
        WHEN rt.destination IS NULL THEN NULL
        ELSE GREATEST(
          1,
          CEIL(
            (
              ST_Distance(rll.location, rt.destination) / 1000.0
            )
            /
            GREATEST(COALESCE(NULLIF(ABS(rll.speed_kmph), 0), 28), 8)
            * 60.0
          )::int
        )
      END AS eta_min,
      rll.updated_at,
      u.full_name,
      CASE WHEN r.driver_id = rll.user_id THEN 'driver' ELSE 'rider' END AS role
    FROM ride_live_locations rll
    JOIN rides r ON r.id = rll.ride_id
    LEFT JOIN routes rt ON rt.id = r.route_id
    LEFT JOIN users u ON u.id = rll.user_id
    WHERE rll.ride_id = $1
      AND rll.updated_at >= NOW() - ($2::int * INTERVAL '1 second')
    ORDER BY rll.updated_at DESC`,
    [rideId, safeMaxAge],
  );

  return result.rows;
};

const getRideMemberUserIds = async (rideId) => {
  const result = await query(
    `SELECT DISTINCT user_id::text AS user_id
     FROM (
       SELECT r.driver_id AS user_id
       FROM rides r
       WHERE r.id = $1

       UNION ALL

       SELECT rp.rider_id AS user_id
       FROM ride_participants rp
       WHERE rp.ride_id = $1
     ) ride_members
     WHERE user_id IS NOT NULL`,
    [rideId],
  );

  return result.rows.map((row) => row.user_id);
};

export {
  createRide,
  joinRide,
  createRideRequest,
  getRideById,
  updateRideStatus,
  getMyRides,
  cancelRide,
  updateParticipantStatus,
  upsertLiveLocation,
  getLiveLocations,
  getRideMemberUserIds,
};
