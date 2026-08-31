const express = require("express");
const router = express.Router();
const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require("../controllers/taskController");
const { getComments, createComment } = require("../controllers/commentController");
const { protect, authorize } = require("../middleware/authMiddleware");


router.post("/", protect, authorize("admin", "pm"), createTask);
router.get("/", protect, getTasks);
router.get("/:id", protect, getTaskById);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

// Comments are scoped under their task; editing/deleting a specific comment
// is handled by the standalone /comments/:id routes (commentRoutes.js)
// since that only needs the comment's own id, not its task's.
router.get("/:taskId/comments", protect, getComments);
router.post("/:taskId/comments", protect, createComment);

module.exports = router;