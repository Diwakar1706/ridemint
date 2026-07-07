import { Router } from "express";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/helpers.js";
import { getMe, updateMe, updateLocations, getPublic } from "./users.controller.js";

const router = Router();

router.get("/me", auth, asyncHandler(getMe));
router.put("/me", auth, asyncHandler(updateMe));
router.put("/me/locations", auth, asyncHandler(updateLocations));
router.get("/:id/public", auth, asyncHandler(getPublic));

export default router;
