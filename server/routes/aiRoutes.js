const express = require("express");
const router = express.Router();
const {
  generateTasks,
  breakdownExistingTask,
  getProjectSummary,
  getProjectRisks,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// Mounted at both /api/projects and /api/tasks in server.js, so paths
// below are written generically ("/:id/ai/...") and match whichever
// resource id is relevant to that action.

// Project-scoped AI actions
router.post("/:id/ai/generate-tasks", protect, generateTasks);
router.get("/:projectId/ai/summary", protect, getProjectSummary);
router.get("/:projectId/ai/risks", protect, getProjectRisks);

// Task-scoped AI action
router.post("/:id/ai/breakdown", protect, breakdownExistingTask);

module.exports = router;