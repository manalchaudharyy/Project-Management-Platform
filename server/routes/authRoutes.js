const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Stricter than the global API limiter — login is the most brute-forceable
// endpoint in the app.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});
const {
  register,
  login,
  getMe,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.post("/refresh", protect, refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/change-password", protect, changePassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

module.exports = router;