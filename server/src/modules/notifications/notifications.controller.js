import { AppError } from "../../utils/helpers.js";
import * as notificationsService from "./notifications.service.js";

const listMyNotifications = async (req, res) => {
  const notifications = await notificationsService.getMyNotifications(
    req.user.userId,
    {
      limit: req.query.limit,
      unreadOnly: req.query.unreadOnly === "true",
    },
  );

  res.json({ success: true, count: notifications.length, notifications });
};

const markNotificationRead = async (req, res) => {
  const notification = await notificationsService.markAsRead(
    req.params.id,
    req.user.userId,
  );

  if (!notification) throw new AppError("Notification not found", 404);
  res.json({ success: true, notification });
};

const markMyNotificationsRead = async (req, res) => {
  const result = await notificationsService.markAllAsRead(req.user.userId);
  res.json({ success: true, ...result });
};

const createMyNotification = async (req, res) => {
  const { type, title, body, data } = req.body;
  if (!type) throw new AppError("type is required", 400);

  const notification = await notificationsService.createNotification({
    userId: req.user.userId,
    type,
    title,
    body,
    data,
  });

  res.status(201).json({ success: true, notification });
};

export {
  listMyNotifications,
  markNotificationRead,
  markMyNotificationsRead,
  createMyNotification,
};
