const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  uploadAttachment,
  deleteAttachment,
} = require("../controllers/taskController");

const { getComments, createComment } = require("../controllers/commentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const upload = require("../middleware/upload");

router.post("/", protect, authorize("admin", "pm"), createTask);
router.get("/", protect, getTasks);
router.get("/:id", protect, validateObjectId("id"), getTaskById);
router.put("/:id", protect, validateObjectId("id"), updateTask);
router.delete("/:id", protect, validateObjectId("id"), deleteTask);
router.get("/:taskId/comments", protect, validateObjectId("taskId"), getComments);
router.post(
  "/:taskId/comments",
  protect,
  validateObjectId("taskId"),
  upload.single("file"),
  createComment
);

router.post(
  "/:id/attachments",
  protect,
  validateObjectId("id"),
  upload.single("file"),
  uploadAttachment
);
router.delete(
  "/:id/attachments/:attachmentId",
  protect,
  validateObjectId("id"),
  deleteAttachment
);
module.exports = router;