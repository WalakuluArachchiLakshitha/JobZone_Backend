import Notification from "../models/Notification.js";
import { handleError } from "../utils/helpers.js";

// ── GET /api/notifications ───────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate({
        path: "sender",
        select: "name email title avatar skills location phone experience availability resumeUrl bio",
      })
      .populate({
        path: "job",
        select: "title company location type salary category status",
      })
      .populate({
        path: "application",
        select: "status coverLetter createdAt",
      })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return handleError(res, "Get notifications", error);
  }
};

// ── PATCH /api/notifications/:id/read ───────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { returnDocument: "after" }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
      unreadCount,
    });
  } catch (error) {
    return handleError(res, "Mark notification as read", error);
  }
};

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      unreadCount: 0,
    });
  } catch (error) {
    return handleError(res, "Mark all notifications as read", error);
  }
};

// ── DELETE /api/notifications/:id ───────────────────────────────────────────
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: "Notification deleted.",
      unreadCount,
    });
  } catch (error) {
    return handleError(res, "Delete notification", error);
  }
};

// ── DELETE /api/notifications ────────────────────────────────────────────────
const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    return res.status(200).json({
      success: true,
      message: "All notifications cleared.",
      unreadCount: 0,
    });
  } catch (error) {
    return handleError(res, "Clear notifications", error);
  }
};

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
