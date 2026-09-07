// server/routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const { generateTasks } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/projects/:projectId/ai/generate-tasks
router.post("/:projectId/ai/generate-tasks", protect, generateTasks);

module.exports = router;