import express from "express";
import { param } from "express-validator";
import {
  saveJob,
  getSavedJobs,
  unsaveJob,
} from "../controllers/savedJobController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// All saved-job routes require authentication
router.use(protectRoute);

router.post("/", saveJob);
router.get("/", getSavedJobs);
router.delete(
  "/:jobId",
  [param("jobId").isMongoId().withMessage("Invalid job ID format")],
  unsaveJob
);

export default router;
