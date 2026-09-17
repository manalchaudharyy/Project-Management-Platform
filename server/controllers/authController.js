const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const BlacklistedToken = require("../models/BlacklistedToken");
const sendEmail = require("../utils/sendEmail");

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role, jti: crypto.randomUUID() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

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

    const allowedRoles = ["member", "pm"];
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
      // An admin/PM creating this account directly is vouching for the
      // email address — no verification link needed.
      isVerified: true,
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

// Shared helper: generates a raw verification token, stores only its hash
// on the user (mirrors the reset-password pattern), and emails the raw
// token as a link. Used by both register and resendVerification.
const issueVerificationEmail = async (user) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await user.save();

  const frontendUrl = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0]
    .trim();
  const verifyUrl = `${frontendUrl}/verify-email/${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    html: `<p>Hi ${user.username},</p>
           <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
           <p><a href="${verifyUrl}">${verifyUrl}</a></p>
           <p>If you didn't create this account, you can safely ignore this email.</p>`,
  });
};

// POST /api/auth/register — public self-signup.
// Unlike createUser (admin/PM only, can grant "pm"), this always forces
// the new account to "member" — a public endpoint must never let the
// caller choose their own elevated role.
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

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
      role: "member",
      isVerified: false,
    });

    // No token, no auto-login: the account can't be used until the emailed
    // link is clicked.
    await issueVerificationEmail(user);

    res.status(201).json({
      message: "Account created. Check your email for a verification link before signing in.",
      email: user.email,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

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

    // Locked? Tell them how long is left rather than a generic error, so
    // it's distinguishable from a plain wrong password.
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(423).json({
        message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
        code: "ACCOUNT_LOCKED",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Correct password — clear any lockout state.
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    if (!user.isVerified) {
      // 403 (not 401) so the frontend can tell "wrong password" apart from
      // "right password, unverified account" and offer a resend option.
      return res.status(403).json({
        message: "Please verify your email before signing in.",
        code: "EMAIL_NOT_VERIFIED",
      });
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

const logout = async (req, res) => {
  try {
    const { jti, exp } = req.user;

    if (jti && exp) {
      await BlacklistedToken.create({ jti, expiresAt: new Date(exp * 1000) });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ message: "Logged out successfully" });
    }
    console.error("Logout error:", error.message);
    res.status(500).json({ message: "Server error during logout" });
  }
};

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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const genericMessage = "If an account with that email exists, a reset link has been sent.";

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // CLIENT_URL may hold a comma-separated list (used for CORS, where
    // multiple origins are allowed at once) — for the reset link we only
    // ever want a single URL, so take just the first one.
    const frontendUrl = (process.env.CLIENT_URL || "http://localhost:5173")
      .split(",")[0]
      .trim();
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>Hi ${user.username},</p>
             <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>If you didn't request this, you can safely ignore this email.</p>`,
    });

    res.status(200).json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ message: "Server error processing request" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ message: "Server error resetting password" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
  return res.status(400).json({ message: "New password must be at least 6 characters" });
}
if (newPassword === currentPassword) {
  return res.status(400).json({ message: "New password must be different from the current password" });
}

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error.message);
    res.status(500).json({ message: "Server error changing password" });
  }
};

// GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Verification link is invalid or has expired" });
    }

    if (user.isVerified) {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
      return res.status(200).json({ message: "Email already verified. You can log in." });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Verify email error:", error.message);
    res.status(500).json({ message: "Server error verifying email" });
  }
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Same generic-message pattern as forgotPassword — don't reveal
    // whether the email exists.
    const genericMessage = "If an account with that email exists and isn't verified yet, a new verification link has been sent.";

    const user = await User.findOne({ email });
    if (!user || user.isVerified) {
      return res.status(200).json({ message: genericMessage });
    }

    await issueVerificationEmail(user);

    res.status(200).json({ message: genericMessage });
  } catch (error) {
    console.error("Resend verification error:", error.message);
    res.status(500).json({ message: "Server error resending verification email" });
  }
};

module.exports = {
  createUser,
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
};