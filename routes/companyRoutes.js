import express from "express";
import { body, param } from "express-validator";
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
} from "../controllers/companyController.js";
import { protectRoute, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Validation ────────────────────────────────────────────────────────────

const createCompanyValidation = [
  body("name").notEmpty().withMessage("Company name is required"),
  body("industry").notEmpty().withMessage("Industry is required"),
  body("location").notEmpty().withMessage("Location is required"),
];

const companyIdValidation = [
  param("id").isMongoId().withMessage("Invalid company ID format"),
];

// ── Routes ────────────────────────────────────────────────────────────────

// Public
router.get("/", getCompanies);
router.get("/:id", companyIdValidation, getCompanyById);

// Protected employer routes
router.post(
  "/",
  protectRoute,
  restrictTo("employer"),
  createCompanyValidation,
  createCompany
);

router.put(
  "/:id",
  protectRoute,
  restrictTo("employer"),
  companyIdValidation,
  updateCompany
);

export default router;
