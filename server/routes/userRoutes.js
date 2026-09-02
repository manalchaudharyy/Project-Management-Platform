const express = require("express");
const router = express.Router();
const { getUsers, updateUserRole, deleteUser } = require("../controllers/userController");
const { createUser } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin", "pm"), getUsers);
router.post("/", protect, authorize("admin", "pm"), createUser);
router.put("/:id/role", protect, authorize("admin", "pm"), updateUserRole);
router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;