import { Router } from "express";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/helpers.js";
import { getMyVehicles, addVehicle, updateVehicle, deleteVehicle } from "./vehicles.controller.js";

const router = Router();

router.get("/", auth, asyncHandler(getMyVehicles));
router.post("/", auth, asyncHandler(addVehicle));
router.put("/:id", auth, asyncHandler(updateVehicle));
router.delete("/:id", auth, asyncHandler(deleteVehicle));

export default router;
