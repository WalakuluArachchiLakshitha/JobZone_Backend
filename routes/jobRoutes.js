import express from "express";
import { body, param } from "express-validator";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} from "../controllers/jobController.js";
import { protectRoute, restrictTo } from "../middleware/authMiddleware.js";
import { JOB_TYPES, VALID_JOB_STATUSES } from "../utils/constants.js";

const router = express.Router();

// ── Validation rules ───────────────────────────────────────────────────────

const createJobValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 120 })
    .withMessage("Title must be between 3 and 120 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be between 10 and 5000 characters"),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),

  body("type")
    .notEmpty()
    .withMessage("Job type is required")
    .isIn(JOB_TYPES)
    .withMessage(`Job type must be one of: ${JOB_TYPES.join(", ")}`),

  body("salary")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Salary must be a positive number"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),

  body("skills.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each skill must be a string"),
];

const updateJobValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage("Title must be between 3 and 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be between 10 and 5000 characters"),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),

  body("type")
    .optional()
    .isIn(JOB_TYPES)
    .withMessage(`Job type must be one of: ${JOB_TYPES.join(", ")}`),

  body("salary")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Salary must be a positive number"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),

  body("skills.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each skill must be a string"),

  body("status")
    .optional()
    .isIn(VALID_JOB_STATUSES)
    .withMessage(`Status must be one of: ${VALID_JOB_STATUSES.join(", ")}`),
];

const idParamValidation = [
  param("id").isMongoId().withMessage("Invalid job ID format"),
];

// ── Routes ─────────────────────────────────────────────────────────────────

router.post(
  "/",
  protectRoute,
  restrictTo("employer"),
  createJobValidation,
  createJob
);

router.get("/", getJobs);

router.get("/:id", idParamValidation, getJobById);

router.put(
  "/:id",
  protectRoute,
  restrictTo("employer"),
  [...idParamValidation, ...updateJobValidation],
  updateJob
);

router.delete(
  "/:id",
  protectRoute,
  restrictTo("employer"),
  idParamValidation,
  deleteJob
);

export default router;
