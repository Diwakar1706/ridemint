import { AppError } from "../../utils/helpers.js";
import { emitToUser } from "../notifications/socket.handler.js";
import * as ridesService from "./rides.service.js";

const allowedRideStatuses = [
  "requested",
  "accepted",
  "driver_arriving",
  "in_progress",
  "completed",
  "cancelled",
];

const createRide = async (req, res) => {
  const { vehicleId, routeId } = req.body;
  if (!vehicleId || !routeId) {
    throw new AppError("vehicleId and routeId are required", 400);
  }

  const ride = await ridesService.createRide(req.user.userId, req.body);
  res.status(201).json({ success: true, ride });
};

const requestRide = async (req, res) => {
  const driverRouteId = req.body.driverRouteId || req.body.routeId;
  const pickupLng = req.body.pickupPoint?.lng ?? req.body.pickupLng;
  const pickupLat = req.body.pickupPoint?.lat ?? req.body.pickupLat;
  const dropoffLng = req.body.dropoffPoint?.lng ?? req.body.dropoffLng;
  const dropoffLat = req.body.dropoffPoint?.lat ?? req.body.dropoffLat;

  if (!driverRouteId) {
    throw new AppError("driverRouteId is required", 400);
  }

  const coordinateFields = { pickupLng, pickupLat, dropoffLng, dropoffLat };
  for (const [key, value] of Object.entries(coordinateFields)) {
    if (value === undefined || value === null) {
      throw new AppError(`Missing required field: ${key}`, 400);
    }
  }

  const result = await ridesService.createRideRequest(req.user.userId, {
    ...req.body,
    driverRouteId,
    pickupLng,
    pickupLat,
    dropoffLng,
    dropoffLat,
    pickupAddress: req.body.pickupPoint?.address || req.body.pickupAddress,
    dropoffAddress: req.body.dropoffPoint?.address || req.body.dropoffAddress,
  });

  res.status(201).json({ success: true, ...result });
};

const joinRide = async (req, res) => {
  const required = ["pickupLng", "pickupLat", "dropoffLng", "dropoffLat"];
  for (const key of required) {
    if (req.body[key] === undefined || req.body[key] === null) {
      throw new AppError(`Missing required field: ${key}`, 400);
    }
  }

  const participant = await ridesService.joinRide(
    req.params.id,
    req.user.userId,
    req.body,
  );

  res.status(201).json({ success: true, participant });
};

const getRide = async (req, res) => {
  const ride = await ridesService.getRideById(req.params.id, req.user.userId);
  if (!ride) throw new AppError("Ride not found", 404);
  res.json({ success: true, ride });
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!allowedRideStatuses.includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const ride = await ridesService.updateRideStatus(
    req.params.id,
    req.user.userId,
    status,
  );
  if (!ride) throw new AppError("Ride not found or not owned by driver", 404);

  res.json({ success: true, ride });
};

const getMyRides = async (req, res) => {
  const rides = await ridesService.getMyRides(req.user.userId, {
    status: req.query.status,
    role: req.query.role,
  });
  res.json({ success: true, rides });
};

const acceptRide = async (req, res) => {
  const ride = await ridesService.updateRideStatus(
    req.params.id,
    req.user.userId,
    "accepted",
  );
  if (!ride) throw new AppError("Ride not found or not owned by driver", 404);

  res.json({ success: true, ride });
};

const rejectRide = async (req, res) => {
  const ride = await ridesService.updateRideStatus(
    req.params.id,
    req.user.userId,
    "cancelled",
  );
  if (!ride) throw new AppError("Ride not found or not owned by driver", 404);

  res.json({ success: true, ride });
};

const cancelRide = async (req, res) => {
  const ride = await ridesService.cancelRide(req.params.id, req.user.userId);
  if (!ride) throw new AppError("Ride not found", 404);

  res.json({ success: true, ride });
};

const startRide = async (req, res) => {
  const ride = await ridesService.updateRideStatus(
    req.params.id,
    req.user.userId,
    "in_progress",
  );
  if (!ride) throw new AppError("Ride not found or not owned by driver", 404);

  res.json({ success: true, ride });
};

const completeRide = async (req, res) => {
  const ride = await ridesService.updateRideStatus(
    req.params.id,
    req.user.userId,
    "completed",
  );
  if (!ride) throw new AppError("Ride not found or not owned by driver", 404);

  res.json({ success: true, ride });
};

const pickupParticipant = async (req, res) => {
  const participant = await ridesService.updateParticipantStatus(
    req.params.id,
    req.params.participantId,
    req.user.userId,
    "picked_up",
  );
  if (!participant) {
    throw new AppError(
      "Participant not found or ride not owned by driver",
      404,
    );
  }

  const ride = await ridesService.getRideById(req.params.id, req.user.userId);
  res.json({ success: true, participant, ride });
};

const dropoffParticipant = async (req, res) => {
  const participant = await ridesService.updateParticipantStatus(
    req.params.id,
    req.params.participantId,
    req.user.userId,
    "dropped_off",
  );
  if (!participant) {
    throw new AppError(
      "Participant not found or ride not owned by driver",
      404,
    );
  }

  const ride = await ridesService.getRideById(req.params.id, req.user.userId);
  res.json({ success: true, participant, ride });
};

const shareLiveLocation = async (req, res) => {
  const { lat, lng } = req.body || {};

  if (lat === undefined || lat === null) {
    throw new AppError("lat is required", 400);
  }
  if (lng === undefined || lng === null) {
    throw new AppError("lng is required", 400);
  }

  const location = await ridesService.upsertLiveLocation(
    req.params.id,
    req.user.userId,
    {
      lat,
      lng,
      accuracy: req.body?.accuracy,
      speedKmph: req.body?.speedKmph,
      heading: req.body?.heading,
    },
  );

  const rideMemberUserIds = await ridesService.getRideMemberUserIds(
    req.params.id,
  );

  const payload = {
    rideId: req.params.id,
    location,
  };

  for (const userId of rideMemberUserIds) {
    emitToUser(userId, "ride:live_location", payload);
  }

  res.json({ success: true, location });
};

const getRideLiveLocations = async (req, res) => {
  const locations = await ridesService.getLiveLocations(
    req.params.id,
    req.user.userId,
    {
      maxAgeSec: req.query.maxAgeSec,
    },
  );

  res.json({ success: true, count: locations.length, locations });
};

export {
  createRide,
  requestRide,
  joinRide,
  getRide,
  updateStatus,
  getMyRides,
  acceptRide,
  rejectRide,
  cancelRide,
  startRide,
  completeRide,
  pickupParticipant,
  dropoffParticipant,
  shareLiveLocation,
  getRideLiveLocations,
};
