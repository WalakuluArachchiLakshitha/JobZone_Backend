import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/clear-all", clearAllNotifications);
router.delete("/:id", deleteNotification);

export default router;
