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
 
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;