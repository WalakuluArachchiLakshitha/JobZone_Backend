import express from "express";
import { body, param } from "express-validator";
import {
  getProfile,
  updateProfile,
  changePassword,
  getSeekers,
  getSeekerById,
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/authMiddleware.js";
import { AVAILABILITY_OPTIONS } from "../utils/constants.js";
import User from "../models/User.js";
import {
  uploadAvatar,
  uploadResume,
  uploadCompanyBR,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ── Validation rules for profile update ───────────────────────────────────

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("firstName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone cannot exceed 20 characters"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Bio cannot exceed 2000 characters"),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),

  body("country")
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage("Country cannot exceed 60 characters"),

  body("region")
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage("Region cannot exceed 60 characters"),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage("City cannot exceed 60 characters"),

  // Seeker-specific fields
  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),

  body("skills.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each skill must be a string"),

  body("availability")
    .optional()
    .isIn(AVAILABILITY_OPTIONS)
    .withMessage(
      "Availability must be one of: immediate, 1_week, 2_weeks, 1_month, not_available"
    ),

  // Employer-specific fields
  body("companyName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Company name cannot exceed 100 characters"),
];

// ── Change password validation ────────────────────────────────────────────

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

// ── Seeker ID validation ──────────────────────────────────────────────────

const seekerIdValidation = [
  param("id").isMongoId().withMessage("Invalid candidate ID format"),
];

// ── Routes ─────────────────────────────────────────────────────────────────

// Protected profile routes
router.get("/profile", protectRoute, getProfile);
router.put("/profile", protectRoute, updateProfileValidation, updateProfile);
router.put(
  "/change-password",
  protectRoute,
  changePasswordValidation,
  changePassword
);

// Upload routes (protected)
router.post("/upload-avatar", protectRoute, uploadAvatar, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const url = `/uploads/avatars/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { avatar: url });
    res.status(200).json({ success: true, avatarUrl: url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/upload-resume", protectRoute, uploadResume, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const url = `/uploads/resumes/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { resumeUrl: url });
    res.status(200).json({ success: true, resumeUrl: url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/upload-br", protectRoute, uploadCompanyBR, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const url = `/uploads/documents/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { companyBR: url });
    res.status(200).json({ success: true, companyBRUrl: url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public seeker/candidate routes
router.get("/seekers", getSeekers);
router.get("/seekers/:id", seekerIdValidation, getSeekerById);

export default router;
