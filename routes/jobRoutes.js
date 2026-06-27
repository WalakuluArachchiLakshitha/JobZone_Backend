import express from "express";
import { body, param } from "express-validator";
import {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
} from "../controllers/jobController.js";
import { protectRoute, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Validation rules ──────────────────────────────────────────────────────

const createJobValidation = [
  body("title")
    .notEmpty()
    .withMessage("Job title is required")
    .isLength({ max: 120 })
    .withMessage("Title cannot exceed 120 characters"),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("location")
    .notEmpty()
    .withMessage("Location is required"),

  body("type")
    .notEmpty()
    .withMessage("Job type is required"),

  body("salary")
    .optional()
    .isNumeric()
    .withMessage("Salary must be a number"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),

  body("noOfPositions")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Number of positions must be at least 1"),
];

const updateJobValidation = [
  param("id").isMongoId().withMessage("Invalid job ID format"),

  body("title")
    .optional()
    .isLength({ max: 120 })
    .withMessage("Title cannot exceed 120 characters"),

  body("description")
    .optional()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),
];

const jobIdValidation = [
  param("id").isMongoId().withMessage("Invalid job ID format"),
];

// ── Routes ─────────────────────────────────────────────────────────────────

// Public routes
router.get("/", getJobs);

// Protected employer routes (MUST be before /:id to avoid "employer" matching as an ID)
router.get(
  "/employer/my-jobs",
  protectRoute,
  restrictTo("employer"),
  getMyJobs
);

router.post(
  "/",
  protectRoute,
  restrictTo("employer"),
  createJobValidation,
  createJob
);

router.put(
  "/:id",
  protectRoute,
  restrictTo("employer"),
  updateJobValidation,
  updateJob
);

router.delete(
  "/:id",
  protectRoute,
  restrictTo("employer"),
  jobIdValidation,
  deleteJob
);

// Public single-job route (AFTER all specific paths)
router.get("/:id", jobIdValidation, getJobById);

export default router;
