import { Router } from "express";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/helpers.js";
import { findMatches, getAlerts, upsertAlert } from "./matching.controller.js";

const router = Router();

router.get("/find", auth, asyncHandler(findMatches));   // legacy alias
router.get("/", auth, asyncHandler(findMatches));
router.post("/search", auth, asyncHandler(findMatches));
router.get("/alerts", auth, asyncHandler(getAlerts));
router.post("/alerts", auth, asyncHandler(upsertAlert));

export default router;
