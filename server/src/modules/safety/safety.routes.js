import { Router } from "express";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/helpers.js";
import {
  listContacts,
  createContact,
  deleteContact,
  createSos,
  resolveSos,
  listSos,
} from "./safety.controller.js";

const router = Router();

router.get("/contacts", auth, asyncHandler(listContacts));
router.post("/contacts", auth, asyncHandler(createContact));
router.delete("/contacts/:id", auth, asyncHandler(deleteContact));

// Spec-aligned aliases.
router.get("/emergency-contacts", auth, asyncHandler(listContacts));
router.post("/emergency-contacts", auth, asyncHandler(createContact));
router.delete("/emergency-contacts/:id", auth, asyncHandler(deleteContact));

router.get("/sos", auth, asyncHandler(listSos));
router.post("/sos", auth, asyncHandler(createSos));
router.patch("/sos/:id/resolve", auth, asyncHandler(resolveSos));

export default router;
