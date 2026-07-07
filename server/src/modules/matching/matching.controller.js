import { AppError } from "../../utils/helpers.js";
import * as matchingService from "./matching.service.js";
import * as routesService from "../routes/routes.service.js";

// Two ways to search: ?routeId=xxx (reuse a saved route as criteria)
// or POST a raw criteria object.
const findMatches = async (req, res) => {
  let criteria;
  if (req.query.routeId) {
    const route = await routesService.getById(req.query.routeId, req.user.userId);
    if (!route) throw new AppError("Route not found", 404);
    criteria = {
      originLat: route.origin_lat,
      originLng: route.origin_lng,
      destLat: route.dest_lat,
      destLng: route.dest_lng,
      departureTime: route.departure_time,
      type: route.type,
      role: route.role,
      timeFlexMin: route.time_flex_min,
      recurringDays: route.recurring_days || [],
    };
  } else {
    criteria = req.body;
  }

  const required = ["originLat", "originLng", "destLat", "destLng", "departureTime", "type", "role"];
  for (const key of required) {
    if (criteria[key] === undefined || criteria[key] === null) {
      throw new AppError(`Missing required field: ${key}`, 400);
    }
  }

  const matches = await matchingService.findMatches(req.user.userId, criteria);
  res.json({ success: true, count: matches.length, matches });
};

const getAlerts = async (req, res) => {
  const alerts = await matchingService.getMatchAlerts(req.user.userId);
  res.json({ success: true, count: alerts.length, alerts });
};

const upsertAlert = async (req, res) => {
  const { routeId, isEnabled } = req.body;
  if (!routeId) throw new AppError("routeId is required", 400);
  const alert = await matchingService.upsertMatchAlert(req.user.userId, { routeId, isEnabled });
  if (!alert) throw new AppError("Route not found", 404);
  res.status(201).json({ success: true, alert });
};

export { findMatches, getAlerts, upsertAlert };
