import express from "express";
import { body } from "express-validator";
import {
  submitContact,
  getContactMessages,
} from "../controllers/contactController.js";
import { protectRoute, restrictTo } from "../middleware/authMiddleware.js";
import { contactLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// ── Validation ────────────────────────────────────────────────────────────

const contactValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 5000 })
    .withMessage("Message cannot exceed 5000 characters"),
];

// ── Routes ────────────────────────────────────────────────────────────────

// Public — anyone can submit a contact form
router.post("/", contactLimiter, contactValidation, submitContact);

// Admin only — list submissions
router.get("/", protectRoute, restrictTo("admin"), getContactMessages);

export default router;
