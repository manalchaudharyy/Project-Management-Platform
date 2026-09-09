const express = require("express");
const router = express.Router();
const { login, getMe, logout, refresh } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.post("/refresh", protect, refresh);

module.exports = router;