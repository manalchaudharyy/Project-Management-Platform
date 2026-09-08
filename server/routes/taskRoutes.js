const express = require("express");

const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const {
  getComments,
  createComment,
} = require("../controllers/commentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

/* Create task */
router.post(
  "/",
  protect,
  authorize("admin", "pm"),
  createTask
);

/* Get tasks */
router.get(
  "/",
  protect,
  getTasks
);

/* Get single task */
router.get(
  "/:id",
  protect,
  getTaskById
);

/* Edit task */
router.put(
  "/:id",
  protect,
  updateTask
);

/* Delete task */
router.delete(
  "/:id",
  protect,
  deleteTask
);

/* Task comments */
router.get(
  "/:taskId/comments",
  protect,
  getComments
);

router.post(
  "/:taskId/comments",
  protect,
  createComment
);

module.exports = router;