const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const BlacklistedToken = require("../models/BlacklistedToken");

// Every token gets a unique `jti` (JWT ID). This is what lets us revoke
// ONE specific token on logout, instead of invalidating every token a user
// has ever been issued (which would log them out of every device/tab).
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role, jti: crypto.randomUUID() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// POST /api/users (admin/pm) — creates member/pm accounts, never admin
const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const allowedRoles = ["member", "pm"]; // "admin" can never be created here
    const finalRole = allowedRoles.includes(role) ? role : "member";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: finalRole,
    });

    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Create user error:", error.message);
    res.status(500).json({ message: "Server error creating user" });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
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
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// GET /api/auth/me (protected)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("GetMe error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/logout (protected)
// Actually revokes the current token by recording its jti as blacklisted,
// so it can no longer be used even though it hasn't naturally expired yet.
const logout = async (req, res) => {
  try {
    const { jti, exp } = req.user; // set by protect() from the decoded JWT

    if (jti && exp) {
      // exp is in seconds (JWT standard) — convert to a JS Date for expiresAt
      await BlacklistedToken.create({ jti, expiresAt: new Date(exp * 1000) });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    // If the jti is already blacklisted (e.g. double logout call), that's fine.
    if (error.code === 11000) {
      return res.status(200).json({ message: "Logged out successfully" });
    }
    console.error("Logout error:", error.message);
    res.status(500).json({ message: "Server error during logout" });
  }
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