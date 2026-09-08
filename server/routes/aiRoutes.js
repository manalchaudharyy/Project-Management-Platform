
const express = require("express");
const router = express.Router();
const { generateTasks } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.post("/:projectId/ai/generate-tasks", protect, generateTasks);

module.exports = router;