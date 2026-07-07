import { AppError } from "../../utils/helpers.js";
import * as routesService from "./routes.service.js";

const getMyRoutes = async (req, res) => {
  const routes = await routesService.getByUserId(req.user.userId);
  res.json({ success: true, routes });
};

const getRoute = async (req, res) => {
  const route = await routesService.getById(req.params.id, req.user.userId);
  if (!route) throw new AppError("Route not found", 404);
  res.json({ success: true, route });
};

const createRoute = async (req, res) => {
  const route = await routesService.create(req.user.userId, req.body);
  res.status(201).json({ success: true, route });
};

const updateRoute = async (req, res) => {
  const route = await routesService.update(req.params.id, req.user.userId, req.body);
  if (!route) throw new AppError("Route not found", 404);
  res.json({ success: true, route });
};

const deleteRoute = async (req, res) => {
  const route = await routesService.remove(req.params.id, req.user.userId);
  if (!route) throw new AppError("Route not found", 404);
  res.json({ success: true, message: "Route deactivated", route });
};

// Pause/resume a route without deleting it
const toggleRoute = async (req, res) => {
  const current = await routesService.getById(req.params.id, req.user.userId);
  if (!current) throw new AppError("Route not found", 404);
  const route = await routesService.update(req.params.id, req.user.userId, {
    isActive: !current.is_active,
  });
  res.json({ success: true, route });
};

export { getMyRoutes, getRoute, createRoute, updateRoute, deleteRoute, toggleRoute };
