const Project = require("../models/Project");
const Task = require("../models/Task");

// GET /search?term=xyz
const searchItems = async (req, res) => {
  try {
    const term = req.query.term;

    if (!term) {
      return res.status(400).json({ message: "Search term is required" });
    }

    const regex = new RegExp(term, "i");

    // Only search projects the logged-in user owns or is a member of
    const projects = await Project.find({
      $and: [
        { $or: [{ owner: req.user.id }, { members: req.user.id }] },
        { $or: [{ name: regex }, { description: regex }] },
      ],
    });

    // Only search tasks that belong to those same projects
    const allUserProjects = await Project.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }],
    }).select("_id");
    const allUserProjectIds = allUserProjects.map((p) => p._id);

    const tasks = await Task.find({
      project: { $in: allUserProjectIds },
      $or: [{ title: regex }, { description: regex }],
    });

    res.status(200).json({ projects, tasks });
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({ message: "Server error during search" });
  }
};

module.exports = { searchItems };