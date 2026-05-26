import express from "express";
import { body, param } from "express-validator";
import {
  applyForJob,
  getApplications,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { protectRoute, restrictTo } from "../middleware/authMiddleware.js";
import { VALID_APPLICATION_STATUSES } from "../utils/constants.js";

const router = express.Router();

// ── Validation rules ───────────────────────────────────────────────────────

const applyValidation = [
  body("jobId")
    .notEmpty()
    .withMessage("Job ID is required")
    .isMongoId()
    .withMessage("Invalid job ID format"),

  body("coverLetter")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Cover letter cannot exceed 2000 characters"),
];

const updateStatusValidation = [
  param("id").isMongoId().withMessage("Invalid application ID format"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(VALID_APPLICATION_STATUSES)
    .withMessage(
      `Status must be one of: ${VALID_APPLICATION_STATUSES.join(", ")}`
    ),
];

// ── Routes ─────────────────────────────────────────────────────────────────

router.post(
  "/",
  protectRoute,
  restrictTo("seeker"),
  applyValidation,
  applyForJob
);

router.get("/", protectRoute, getApplications);

router.patch(
  "/:id",
  protectRoute,
  restrictTo("employer"),
  updateStatusValidation,
  updateApplicationStatus
);

export default router;
