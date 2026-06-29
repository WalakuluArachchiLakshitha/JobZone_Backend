import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleLogin,
} from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// ── Validation rules ───────────────────────────────────────────────────────

const registerValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["seeker", "employer", "candidate"])
    .withMessage("Role must be one of: seeker, employer, candidate"),

  body("nic")
    .optional()
    .trim()
    .matches(/^([0-9]{9}[vVxX]|[0-9]{12})$/)
    .withMessage("NIC must be a valid Sri Lankan NIC (e.g., 200012345678 or 123456789V)"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
];

const verifyOtpValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits"),
];

const resetPasswordValidation = [
  body("resetToken")
    .notEmpty()
    .withMessage("Reset token is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// ── Routes ─────────────────────────────────────────────────────────────────

router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);

// Password reset flow
router.post("/forgot-password", authLimiter, forgotPasswordValidation, forgotPassword);
router.post("/verify-otp", authLimiter, verifyOtpValidation, verifyOtp);
router.post("/reset-password", authLimiter, resetPasswordValidation, resetPassword);

// Google OAuth
router.post("/google", authLimiter, googleLogin);

export default router;
