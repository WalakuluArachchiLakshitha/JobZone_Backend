import express from "express";
const router = express.Router();

// Stats endpoint
router.get("/", (req, res) => {
  res.json({
    status: "active",
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString()
  });
});

export default router;