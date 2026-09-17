const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
   email: {
    type: String,
    required: true,
    unique:true
  },
   password: {
    type: String,
    required: true,
  },
   role: {
    type: String,
    enum: ["member", "pm", "admin"],
    default: "member",
  },
   // Set only while a "forgot password" request is pending; cleared once
   // used or expired. The raw token is emailed — only its hash is stored.
   resetPasswordToken: {
    type: String,
  },
   resetPasswordExpires: {
    type: Date,
  },
   // Self-registered accounts start unverified and can't log in until they
   // click the emailed link. Admin-created accounts and the seeded admin
   // are created with isVerified already true, since an admin vouching for
   // the account is enough.
   isVerified: {
    type: Boolean,
    default: false,
  },
   // Same pattern as resetPasswordToken — raw token emailed, only the hash
   // stored, cleared once used or replaced by a resend.
   emailVerificationToken: {
    type: String,
  },
   emailVerificationExpires: {
    type: Date,
  },
   // Account-level lockout — counts consecutive failed logins regardless
   // of which IP they came from. Reset to 0 on any successful login.
   failedLoginAttempts: {
    type: Number,
    default: 0,
  },
   // Set once failedLoginAttempts hits the threshold; login is blocked
   // until this timestamp passes, then the counter resets.
   lockUntil: {
    type: Date,
  },
 
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;