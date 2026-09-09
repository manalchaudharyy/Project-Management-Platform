const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ... createUser, login, getMe same as before ...

// POST /api/auth/logout
const logout = async (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};

// POST /api/auth/refresh (protected) — issues a fresh token for the
// already-authenticated user, e.g. when they hit "Continue" on the
// session-timeout warning so their session doesn't expire mid-work.
const refresh = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error.message);
    res.status(500).json({ message: "Server error refreshing token" });
  }
};

module.exports = { createUser, login, getMe, logout, refresh };