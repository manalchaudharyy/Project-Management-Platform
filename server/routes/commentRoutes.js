const express = require("express");
const router = express.Router();
const { updateComment, deleteComment } = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

router.put("/:id", protect, updateComment);
router.delete("/:id", protect, deleteComment);

module.exports = router;