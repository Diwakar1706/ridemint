import { Router } from "express";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/helpers.js";
import {
  addTrackingPoint,
  listTraces,
  startTracking,
  stopTracking,
} from "./gps.controller.js";

const router = Router();

router.post("/start", auth, asyncHandler(startTracking));
router.post("/point", auth, asyncHandler(addTrackingPoint));
router.post("/stop", auth, asyncHandler(stopTracking));
router.get("/traces", auth, asyncHandler(listTraces));

export default router;
