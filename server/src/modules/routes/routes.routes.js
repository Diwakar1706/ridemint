import { Router } from "express";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/helpers.js";
import {
  getMyRoutes, getRoute, createRoute, updateRoute, deleteRoute, toggleRoute,
} from "./routes.controller.js";

const router = Router();

router.get("/", auth, asyncHandler(getMyRoutes));
router.get("/my", auth, asyncHandler(getMyRoutes));
router.post("/", auth, asyncHandler(createRoute));
// Static segment BEFORE parameterized /:id — otherwise "toggle" would
// be captured as an :id value
router.post("/:id/toggle", auth, asyncHandler(toggleRoute));
router.get("/:id", auth, asyncHandler(getRoute));
router.put("/:id", auth, asyncHandler(updateRoute));
router.delete("/:id", auth, asyncHandler(deleteRoute));

export default router;
