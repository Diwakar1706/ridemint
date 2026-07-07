import { AppError } from "../../utils/helpers.js";
import * as vehiclesService from "./vehicles.service.js";

const getMyVehicles = async (req, res) => {
  const vehicles = await vehiclesService.getByUserId(req.user.userId);
  res.json({ success: true, vehicles });
};

const addVehicle = async (req, res) => {
  const vehicle = await vehiclesService.create(req.user.userId, req.body);
  res.status(201).json({ success: true, vehicle });
};

const updateVehicle = async (req, res) => {
  const vehicle = await vehiclesService.update(req.params.id, req.user.userId, req.body);
  if (!vehicle) throw new AppError("Vehicle not found or not owned by you", 404);
  res.json({ success: true, vehicle });
};

const deleteVehicle = async (req, res) => {
  const vehicle = await vehiclesService.remove(req.params.id, req.user.userId);
  if (!vehicle) throw new AppError("Vehicle not found or not owned by you", 404);
  res.json({ success: true, message: "Vehicle deleted", vehicle });
};

export { getMyVehicles, addVehicle, updateVehicle, deleteVehicle };
