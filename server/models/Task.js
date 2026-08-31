const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["todo", "in-progress", "review", "done"],
    default: "todo",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  dueDate: {
    type: Date,
  },
  history: [
    {
      field: { type: String, required: true },
      oldValue: { type: mongoose.Schema.Types.Mixed },
      newValue: { type: mongoose.Schema.Types.Mixed },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      changedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;