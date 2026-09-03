const Project = require("../models/Project");
const Task = require("../models/Task");
const mongoose = require("mongoose");

const PROJECT_STATUS_VALUES = ["planning", "active", "on-hold", "completed", "archived"];

const createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }

    if (status !== undefined && !PROJECT_STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${PROJECT_STATUS_VALUES.join(", ")}`,
      });
    }

    if (startDate !== undefined && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ message: "startDate must be a valid date" });
    }

    if (endDate !== undefined && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ message: "endDate must be a valid date" });
    }

    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      status,
      owner: req.user.id,
      members: [req.user.id],
    });

    res.status(201).json(project);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Create project error:", error.message);
    res.status(500).json({ message: "Server error creating project" });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }],
    });

    res.status(200).json(projects);
  } catch (error) {
    console.error("Get projects error:", error.message);
    res.status(500).json({ message: "Server error fetching projects" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "username email")
      .populate("members", "username email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Mirrors the scoping already used in getProjects: only the owner or a
    // member can view a project's details. Previously this endpoint had no
    // access check at all, so any logged-in user could view any project by
    // guessing/enumerating its id.
    const isOwner = project.owner._id.toString() === req.user.id;
    const isMember = project.members.some((m) => m._id.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Forbidden: you don't have access to this project" });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Get project by id error:", error.message);
    res.status(500).json({ message: "Server error fetching project" });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isPmOrAdmin = req.user.role === "pm" || req.user.role === "admin";

    if (!isOwner && !isPmOrAdmin) {
      return res.status(403).json({ message: "Forbidden: only the owner or a PM/Admin can edit this project" });
    }

    const { name, description, startDate, endDate, status } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: "Project name cannot be empty" });
    }
    if (status !== undefined && !PROJECT_STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${PROJECT_STATUS_VALUES.join(", ")}`,
      });
    }
    if (startDate !== undefined && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ message: "startDate must be a valid date" });
    }
    if (endDate !== undefined && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ message: "endDate must be a valid date" });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (status !== undefined) project.status = status;

    const updatedProject = await project.save();
    res.status(200).json(updatedProject);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Update project error:", error.message);
    res.status(500).json({ message: "Server error updating project" });
  }
};

const addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isPmOrAdmin = req.user.role === "pm" || req.user.role === "admin";

    if (!isOwner && !isPmOrAdmin) {
      return res.status(403).json({ message: "Forbidden: only the owner or a PM/Admin can add members" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (project.members.includes(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    project.members.push(userId);
    await project.save();
    await project.populate("members", "username email");

    res.status(200).json(project);
  } catch (error) {
    console.error("Add member error:", error.message);
    res.status(500).json({ message: "Server error adding member" });
  }
};
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isPmOrAdmin = req.user.role === "pm" || req.user.role === "admin";

    if (!isOwner && !isPmOrAdmin) {
      return res.status(403).json({ message: "Forbidden: only the owner or a PM/Admin can remove members" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (userId === project.owner.toString()) {
      return res.status(400).json({ message: "Cannot remove the project owner" });
    }

    project.members.pull(userId);
    await project.save();
    await project.populate("members", "username email");

    res.status(200).json(project);
  } catch (error) {
    console.error("Remove member error:", error.message);
    res.status(500).json({ message: "Server error removing member" });
  }
};
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isPmOrAdmin = req.user.role === "pm" || req.user.role === "admin";

    if (!isOwner && !isPmOrAdmin) {
      return res.status(403).json({ message: "Forbidden: only the owner or a PM/Admin can delete this project" });
    }

    await project.deleteOne();
    res.status(200).json({ message: "Project deleted" });
  } catch (error) {
    console.error("Delete project error:", error.message);
    res.status(500).json({ message: "Server error deleting project" });
  }
};
const getProjectDashboard = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members.some((m) => m.toString() === req.user.id);
    if (!isOwner && !isMember && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: you don't have access to this project" });
    }

    const projectId = new mongoose.Types.ObjectId(req.params.id);

    const [result] = await Task.aggregate([
      { $match: { project: projectId } },
      {
        $facet: {
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
          overdue: [
            { $match: { dueDate: { $lt: new Date() }, status: { $ne: "done" } } },
            { $count: "count" },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const toCountMap = (arr) =>
      arr.reduce((acc, { _id, count }) => {
        acc[_id || "unset"] = count;
        return acc;
      }, {});

    const total = result.total[0]?.count || 0;
    const byStatus = toCountMap(result.byStatus);
    const completed = byStatus.done || 0;

    res.status(200).json({
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: total - completed,
      overdueTasks: result.overdue[0]?.count || 0,
      tasksByStatus: byStatus,
      tasksByPriority: toCountMap(result.byPriority),
      completionPercentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    });
  } catch (error) {
    console.error("Get project dashboard error:", error.message);
    res.status(500).json({ message: "Server error fetching dashboard" });
  }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember, removeMember, getProjectDashboard };