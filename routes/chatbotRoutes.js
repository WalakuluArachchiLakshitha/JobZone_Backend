import express from "express";
import { handleMessage } from "../controllers/chatbotController.js";

const router = express.Router();

// Chatbot is public — no authentication required for basic queries
router.post("/message", handleMessage);

export default router;
