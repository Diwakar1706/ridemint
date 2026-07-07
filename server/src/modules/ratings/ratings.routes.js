import { Router } from "express";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/helpers.js";
import { create, getReceived, getGiven } from "./ratings.controller.js";

const router = Router();

router.post("/", auth, asyncHandler(create));
router.get("/received", auth, asyncHandler(getReceived));
router.get("/given", auth, asyncHandler(getGiven));

export default router;
