import express from "express";
import { getResume, updateResume, generateCV } from "../controllers/resumeController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// All resume routes require authentication
router.use(protectRoute);

router.get("/", getResume);
router.put("/", updateResume);
router.get("/generate-cv", generateCV);

export default router;
