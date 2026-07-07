import { randomUUID } from "node:crypto";
import { query } from "../../config/db.js";
import { AppError } from "../../utils/helpers.js";

const activeTraceStore = new Map();

const toNumber = (value) => Number.parseFloat(value);

const ensureFiniteNumber = (value, fieldName) => {
  const parsed = toNumber(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError(`${fieldName} must be a valid number`, 400);
  }
  return parsed;
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const haversineDistanceKm = (start, end) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const normalizePoint = (point) => {
  const lat = ensureFiniteNumber(point.lat, "lat");
  const lng = ensureFiniteNumber(point.lng, "lng");

  return {
    lat,
    lng,
    recordedAt: point.recordedAt || new Date().toISOString(),
    accuracy:
      point.accuracy === undefined || point.accuracy === null
        ? null
        : ensureFiniteNumber(point.accuracy, "accuracy"),
    speed:
      point.speed === undefined || point.speed === null
        ? null
        : ensureFiniteNumber(point.speed, "speed"),
  };
};

const toLineStringWkt = (points) => {
  const coordinatePairs = points.map((point) => `${point.lng} ${point.lat}`);
  return `LINESTRING(${coordinatePairs.join(",")})`;
};

const startTrace = async (userId, payload = {}) => {
  const traceId = randomUUID();
  const startedAt = payload.startedAt || new Date().toISOString();

  const traceState = {
    id: traceId,
    userId,
    routeId: payload.routeId || null,
    startedAt,
    points: [],
    distanceKm: 0,
  };

  if (payload.startPoint) {
    const firstPoint = normalizePoint(payload.startPoint);
    traceState.points.push(firstPoint);
  }

  activeTraceStore.set(traceId, traceState);

  return {
    id: traceState.id,
    route_id: traceState.routeId,
    started_at: traceState.startedAt,
    points_count: traceState.points.length,
    distance_km: Number(traceState.distanceKm.toFixed(4)),
    status: "recording",
  };
};

const addPoint = async (userId, payload) => {
  const traceId = payload.traceId;
  const traceState = activeTraceStore.get(traceId);

  if (!traceState || traceState.userId !== userId) {
    throw new AppError("Active trace not found", 404);
  }

  const point = normalizePoint(payload);
  const previousPoint = traceState.points[traceState.points.length - 1];

  if (previousPoint) {
    traceState.distanceKm += haversineDistanceKm(previousPoint, point);
  }

  traceState.points.push(point);

  return {
    id: traceState.id,
    route_id: traceState.routeId,
    started_at: traceState.startedAt,
    points_count: traceState.points.length,
    distance_km: Number(traceState.distanceKm.toFixed(4)),
    last_point: point,
    status: "recording",
  };
};

const stopTrace = async (userId, payload) => {
  const traceId = payload.traceId;
  const traceState = activeTraceStore.get(traceId);

  if (!traceState || traceState.userId !== userId) {
    throw new AppError("Active trace not found", 404);
  }

  if (traceState.points.length < 2) {
    throw new AppError("At least 2 points are required to stop a trace", 400);
  }

  const endedAt = payload.endedAt || new Date().toISOString();
  const wkt = toLineStringWkt(traceState.points);

  const result = await query(
    `INSERT INTO gps_traces
      (user_id, route_id, trace, started_at, ended_at, distance_km)
    VALUES ($1, $2, ST_GeogFromText($3), $4, $5, $6)
    RETURNING id, user_id, route_id, started_at, ended_at, distance_km, created_at`,
    [
      userId,
      traceState.routeId,
      `SRID=4326;${wkt}`,
      traceState.startedAt,
      endedAt,
      Number(traceState.distanceKm.toFixed(4)),
    ],
  );

  activeTraceStore.delete(traceId);

  return {
    ...result.rows[0],
    points_count: traceState.points.length,
    status: "saved",
  };
};

const getTraces = async (userId, filters = {}) => {
  const limit = Number.parseInt(filters.limit, 10);
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(limit, 1), 100)
    : 20;

  const hasRouteFilter = Boolean(filters.routeId);
  const values = [userId];

  let whereClause = "WHERE gt.user_id = $1";
  if (hasRouteFilter) {
    values.push(filters.routeId);
    whereClause += ` AND gt.route_id = $${values.length}`;
  }

  values.push(safeLimit);

  const result = await query(
    `SELECT
      gt.id,
      gt.user_id,
      gt.route_id,
      gt.started_at,
      gt.ended_at,
      gt.distance_km,
      gt.created_at,
      ST_AsText(gt.trace::geometry) AS trace_wkt,
      rt.origin_address,
      rt.dest_address
    FROM gps_traces gt
    LEFT JOIN routes rt ON rt.id = gt.route_id
    ${whereClause}
    ORDER BY gt.started_at DESC
    LIMIT $${values.length}`,
    values,
  );

  return result.rows;
};

export { startTrace, addPoint, stopTrace, getTraces };
