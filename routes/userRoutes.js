import express from "express";
import { body } from "express-validator";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/authMiddleware.js";
import { AVAILABILITY_OPTIONS } from "../utils/constants.js";

const router = express.Router();

// ── Validation rules for profile update ───────────────────────────────────

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),

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

  body("resumeUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Resume URL must be a valid URL"),

  // Employer-specific fields
  body("companyName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Company name cannot exceed 100 characters"),

  body("companyWebsite")
    .optional()
    .trim()
    .isURL()
    .withMessage("Company website must be a valid URL"),
];

// ── Routes ─────────────────────────────────────────────────────────────────

router.get("/profile", protectRoute, getProfile);
router.put("/profile", protectRoute, updateProfileValidation, updateProfile);

export default router;
