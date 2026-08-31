const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  status: {
  type: String,
  enum: ["planning", "active", "on-hold", "completed", "archived"],
  default: "planning",
},
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
}, { timestamps: true });

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;