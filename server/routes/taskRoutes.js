const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const { getComments, createComment } = require("../controllers/commentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

router.post("/", protect, authorize("admin", "pm"), createTask);
router.get("/", protect, getTasks);
router.get("/:id", protect, validateObjectId("id"), getTaskById);
router.put("/:id", protect, validateObjectId("id"), updateTask);
router.delete("/:id", protect, validateObjectId("id"), deleteTask);
router.get("/:taskId/comments", protect, validateObjectId("taskId"), getComments);
router.post("/:taskId/comments", protect, validateObjectId("taskId"), createComment);

module.exports = router;