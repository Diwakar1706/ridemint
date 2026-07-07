import { Router } from "express";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/helpers.js";
import {
  listMyNotifications,
  markNotificationRead,
  markMyNotificationsRead,
  createMyNotification,
} from "./notifications.controller.js";

const router = Router();

router.get("/", auth, asyncHandler(listMyNotifications));
router.post("/", auth, asyncHandler(createMyNotification));
router.patch("/:id/read", auth, asyncHandler(markNotificationRead));
router.patch("/read-all", auth, asyncHandler(markMyNotificationsRead));

// Spec-aligned aliases.
router.put("/:id/read", auth, asyncHandler(markNotificationRead));
router.put("/read-all", auth, asyncHandler(markMyNotificationsRead));

export default router;
