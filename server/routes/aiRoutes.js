const express = require("express");
const router = express.Router();
const {
  generateTasks,
  breakdownExistingTask,
  getProjectSummary,
  getProjectRisks,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.post("/:projectId/ai/generate-tasks", protect, generateTasks);
router.post("/:id/ai/breakdown", protect, breakdownExistingTask);
router.get("/:projectId/ai/summary", protect, getProjectSummary);
router.get("/:projectId/ai/risks", protect, getProjectRisks);

module.exports = router;