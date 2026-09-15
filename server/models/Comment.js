//MVC model route controller model-> database schema,data shape
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  // Not schema-required: a comment can be attachment-only. The controller
  // enforces "content OR an attachment" instead.
  content: {
    type: String,
    trim: true,
    default: "",
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  attachments: [
    {
      filename: { type: String, required: true },
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;