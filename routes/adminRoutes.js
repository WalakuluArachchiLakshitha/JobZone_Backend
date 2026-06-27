import express from "express";
import { param } from "express-validator";
import {
  getStats,
  getAllUsers,
  deleteUser,
  getPendingVerifications,
  verifyCompany,
  rejectVerification,
  getAllJobs,
  adminDeleteJob,
  getContacts,
} from "../controllers/adminController.js";
import { protectRoute, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protectRoute, restrictTo("admin"));

// ── Validation rules ──────────────────────────────────────────────────────
const idValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];

// ── Routes ─────────────────────────────────────────────────────────────────

// Dashboard statistics
router.get("/stats", getStats);

// User management
router.get("/users", getAllUsers);
router.delete("/users/:id", idValidation, deleteUser);

// Company verification
router.get("/pending-verifications", getPendingVerifications);
router.patch("/verify-company/:id", idValidation, verifyCompany);
router.patch("/reject-verification/:id", idValidation, rejectVerification);

// Job management
router.get("/jobs", getAllJobs);
router.delete("/jobs/:id", idValidation, adminDeleteJob);

// Contact messages
router.get("/contacts", getContacts);

export default router;
