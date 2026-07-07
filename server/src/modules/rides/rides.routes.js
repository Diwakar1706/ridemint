import { Router } from "express";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/helpers.js";
import {
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
} from "./rides.controller.js";

const router = Router();

router.get("/", auth, asyncHandler(getMyRides));
router.get("/my", auth, asyncHandler(getMyRides));
router.post("/request", auth, asyncHandler(requestRide));
router.post("/", auth, asyncHandler(createRide));
router.get("/:id", auth, asyncHandler(getRide));
router.post("/:id/join", auth, asyncHandler(joinRide));
router.patch("/:id/status", auth, asyncHandler(updateStatus));
router.post("/:id/accept", auth, asyncHandler(acceptRide));
router.post("/:id/reject", auth, asyncHandler(rejectRide));
router.post("/:id/cancel", auth, asyncHandler(cancelRide));
router.post("/:id/start", auth, asyncHandler(startRide));
router.post(
  "/:id/pickup/:participantId",
  auth,
  asyncHandler(pickupParticipant),
);
router.post(
  "/:id/dropoff/:participantId",
  auth,
  asyncHandler(dropoffParticipant),
);
router.post("/:id/complete", auth, asyncHandler(completeRide));
router.post("/:id/live-location", auth, asyncHandler(shareLiveLocation));
router.get("/:id/live-locations", auth, asyncHandler(getRideLiveLocations));

export default router;
