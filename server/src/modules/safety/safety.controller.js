import { AppError } from "../../utils/helpers.js";
import * as safetyService from "./safety.service.js";

const listContacts = async (req, res) => {
  const contacts = await safetyService.getEmergencyContacts(req.user.userId);
  res.json({ success: true, count: contacts.length, contacts });
};

const createContact = async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new AppError("phone is required", 400);

  const contact = await safetyService.addEmergencyContact(
    req.user.userId,
    req.body,
  );
  res.status(201).json({ success: true, contact });
};

const deleteContact = async (req, res) => {
  const contact = await safetyService.removeEmergencyContact(
    req.params.id,
    req.user.userId,
  );
  if (!contact) throw new AppError("Contact not found", 404);

  res.json({ success: true, contact });
};

const createSos = async (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) {
    throw new AppError("lat and lng are required", 400);
  }

  const sos = await safetyService.triggerSos(req.user.userId, req.body);
  res.status(201).json({ success: true, sos });
};

const resolveSos = async (req, res) => {
  const sos = await safetyService.resolveSos(req.params.id, req.user.userId);
  if (!sos) throw new AppError("Active SOS alert not found", 404);

  res.json({ success: true, sos });
};

const listSos = async (req, res) => {
  const alerts = await safetyService.getMySosAlerts(req.user.userId, {
    status: req.query.status,
  });
  res.json({ success: true, count: alerts.length, alerts });
};

export {
  listContacts,
  createContact,
  deleteContact,
  createSos,
  resolveSos,
  listSos,
};
