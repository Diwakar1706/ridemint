import { AppError } from "../../utils/helpers.js";
import * as usersService from "./users.service.js";

const getMe = async (req, res) => {
  const user = await usersService.getById(req.user.userId); // userId from JWT, not URL
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, user });
};

const updateMe = async (req, res) => {
  const user = await usersService.updateProfile(req.user.userId, req.body);
  res.json({ success: true, user });
};

const updateLocations = async (req, res) => {
  const user = await usersService.updateLocations(req.user.userId, req.body);
  res.json({ success: true, user });
};

const getPublic = async (req, res) => {
  const user = await usersService.getPublicProfile(req.params.id);
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, user });
};

export { getMe, updateMe, updateLocations, getPublic };
