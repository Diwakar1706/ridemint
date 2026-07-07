import { AppError } from "../../utils/helpers.js";
import * as gpsService from "./gps.service.js";

const startTracking = async (req, res) => {
  const trace = await gpsService.startTrace(req.user.userId, req.body || {});
  res.status(201).json({ success: true, trace });
};

const addTrackingPoint = async (req, res) => {
  const { traceId, lat, lng } = req.body || {};

  if (!traceId) {
    throw new AppError("traceId is required", 400);
  }
  if (lat === undefined || lat === null) {
    throw new AppError("lat is required", 400);
  }
  if (lng === undefined || lng === null) {
    throw new AppError("lng is required", 400);
  }

  const trace = await gpsService.addPoint(req.user.userId, req.body);
  res.json({ success: true, trace });
};

const stopTracking = async (req, res) => {
  const { traceId } = req.body || {};

  if (!traceId) {
    throw new AppError("traceId is required", 400);
  }

  const trace = await gpsService.stopTrace(req.user.userId, req.body);
  res.json({ success: true, trace });
};

const listTraces = async (req, res) => {
  const traces = await gpsService.getTraces(req.user.userId, req.query || {});
  res.json({ success: true, count: traces.length, traces });
};

export { startTracking, addTrackingPoint, stopTracking, listTraces };
