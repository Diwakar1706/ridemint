import { Router } from "express";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/helpers.js";
import {
  getWallet,
  topup,
  topupVerify,
  withdraw,
  payRide,
  getTransactions,
} from "./payments.controller.js";

const router = Router();

router.get("/wallet", auth, asyncHandler(getWallet));
router.post("/topup", auth, asyncHandler(topup));
router.post("/topup/verify", auth, asyncHandler(topupVerify));
router.post("/withdraw", auth, asyncHandler(withdraw));
router.post("/rides/:rideId/pay", auth, asyncHandler(payRide));
router.get("/transactions", auth, asyncHandler(getTransactions));

export default router;
