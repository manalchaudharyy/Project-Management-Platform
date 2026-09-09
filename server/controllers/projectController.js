const Project = require("../models/Project");
const Task = require("../models/Task");
const mongoose = require("mongoose");

const PROJECT_STATUS_VALUES = [
  "planning",
  "active",
  "on-hold",
  "completed",
  "archived",
];

/* =========================================================
   CREATE PROJECT
========================================================= */

const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    if (
      status !== undefined &&
      !PROJECT_STATUS_VALUES.includes(status)
    ) {
      return res.status(400).json({
        message: `status must be one of: ${PROJECT_STATUS_VALUES.join(
          ", "
        )}`,
      });
    }

    if (
      startDate !== undefined &&
      isNaN(Date.parse(startDate))
    ) {
      return res.status(400).json({
        message: "startDate must be a valid date",
      });
    }

    if (
      endDate !== undefined &&
      isNaN(Date.parse(endDate))
    ) {
      return res.status(400).json({
        message: "endDate must be a valid date",
      });
    }

    const project = await Project.create({
      name: name.trim(),
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
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error(
      "Create project error:",
      error.message
    );

    res.status(500).json({
      message: "Server error creating project",
    });
  }
};

/* =========================================================
   GET PROJECTS
========================================================= */

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        {
          owner: req.user.id,
        },
        {
          members: req.user.id,
        },
      ],
    });

    res.status(200).json(projects);
  } catch (error) {
    console.error(
      "Get projects error:",
      error.message
    );

    res.status(500).json({
      message: "Server error fetching projects",
    });
  }
};

/* =========================================================
   GET PROJECT BY ID
========================================================= */

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isOwner =
      project.owner.toString() === req.user.id;

    const isMember = project.members.some(
      (member) =>
        member.toString() === req.user.id
    );

    const isAdmin =
      req.user.role === "admin";

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({
        message:
          "Forbidden: you don't have access to this project",
      });
    }

    /*
      Populate owner and ALL members.

      This is important for Kanban.
    */

    await project.populate([
      {
        path: "members",
        select: "username email role",
      },
      {
        path: "owner",
        select: "username email role",
      },
    ]);

    /*
      Make sure owner is also represented
      in the members array.

      This prevents the project owner from
      disappearing from the Kanban member list.
    */

    if (project.owner) {
      const ownerExists =
        project.members.some(
          (member) =>
            member._id.toString() ===
            project.owner._id.toString()
        );

      if (!ownerExists) {
        project.members.push(project.owner);
      }
    }

    res.status(200).json(project);
  } catch (error) {
    console.error(
      "Get project by id error:",
      error.message
    );

    res.status(500).json({
      message: "Server error fetching project",
    });
  }
};

/* =========================================================
   UPDATE PROJECT
========================================================= */

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isOwner =
      project.owner.toString() === req.user.id;

    const isPmOrAdmin =
      req.user.role === "pm" ||
      req.user.role === "admin";

    if (!isOwner && !isPmOrAdmin) {
      return res.status(403).json({
        message:
          "Forbidden: only the owner or a PM/Admin can edit this project",
      });
    }

    const {
      name,
      description,
      startDate,
      endDate,
      status,
    } = req.body;

    if (
      name !== undefined &&
      !name.trim()
    ) {
      return res.status(400).json({
        message:
          "Project name cannot be empty",
      });
    }

    if (
      status !== undefined &&
      !PROJECT_STATUS_VALUES.includes(status)
    ) {
      return res.status(400).json({
        message: `status must be one of: ${PROJECT_STATUS_VALUES.join(
          ", "
        )}`,
      });
    }

    if (
      startDate !== undefined &&
      startDate !== "" &&
      isNaN(Date.parse(startDate))
    ) {
      return res.status(400).json({
        message:
          "startDate must be a valid date",
      });
    }

    if (
      endDate !== undefined &&
      endDate !== "" &&
      isNaN(Date.parse(endDate))
    ) {
      return res.status(400).json({
        message:
          "endDate must be a valid date",
      });
    }

    if (name !== undefined) {
      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = description;
    }

    if (startDate !== undefined) {
      project.startDate =
        startDate || null;
    }

    if (endDate !== undefined) {
      project.endDate =
        endDate || null;
    }

    if (status !== undefined) {
      project.status = status;
    }

    const updatedProject =
      await project.save();

    res.status(200).json(updatedProject);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error(
      "Update project error:",
      error.message
    );

    res.status(500).json({
      message:
        "Server error updating project",
    });
  }
};

/* =========================================================
   ADD MEMBER
========================================================= */

const addMember = async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isOwner =
      project.owner.toString() === req.user.id;

    const isPmOrAdmin =
      req.user.role === "pm" ||
      req.user.role === "admin";

    if (!isOwner && !isPmOrAdmin) {
      return res.status(403).json({
        message:
          "Forbidden: only the owner or a PM/Admin can add members",
      });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const alreadyMember =
      project.members.some(
        (member) =>
          member.toString() === userId
      );

    if (alreadyMember) {
      return res.status(400).json({
        message: "User is already a member",
      });
    }

    project.members.push(userId);

    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.error(
      "Add member error:",
      error.message
    );

    res.status(500).json({
      message: "Server error adding member",
    });
  }
};

/* =========================================================
   REMOVE MEMBER
========================================================= */

const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isOwner =
      project.owner.toString() === req.user.id;

    const isPmOrAdmin =
      req.user.role === "pm" ||
      req.user.role === "admin";

    if (!isOwner && !isPmOrAdmin) {
      return res.status(403).json({
        message:
          "Forbidden: only the owner or a PM/Admin can remove members",
      });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    if (
      userId === project.owner.toString()
    ) {
      return res.status(400).json({
        message:
          "Cannot remove the project owner",
      });
    }

    project.members.pull(userId);

    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.error(
      "Remove member error:",
      error.message
    );

    res.status(500).json({
      message:
        "Server error removing member",
    });
  }
};

/* =========================================================
   DELETE PROJECT
========================================================= */

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isOwner =
      project.owner.toString() === req.user.id;

    const isPmOrAdmin =
      req.user.role === "pm" ||
      req.user.role === "admin";

    if (!isOwner && !isPmOrAdmin) {
      return res.status(403).json({
        message:
          "Forbidden: only the owner or a PM/Admin can delete this project",
      });
    }

    /*
      IMPORTANT FIX:

      Delete all tasks belonging to this
      project before deleting the project.
    */

    await Task.deleteMany({
      project: project._id,
    });

    /*
      Now delete the project.
    */

    await project.deleteOne();

    res.status(200).json({
      message:
        "Project and its tasks deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete project error:",
      error.message
    );

    res.status(500).json({
      message:
        "Server error deleting project",
    });
  }
};

/* =========================================================
   PROJECT DASHBOARD
========================================================= */
const getProjectDashboard = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isOwner = project.owner.toString() === req.user.id;

    const isMember = project.members.some(
      (member) => member.toString() === req.user.id
    );

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({
        message: "Forbidden: you don't have access to this project",
      });
    }

    const projectId = new mongoose.Types.ObjectId(req.params.id);

    const [result] = await Task.aggregate([
      {
        $match: {
          project: projectId,
        },
      },
      {
        $facet: {
          byStatus: [
            {
              $group: { _id: "$status", count: { $sum: 1 } },
            },
          ],

          byPriority: [
            {
              $group: { _id: "$priority", count: { $sum: 1 } },
            },
          ],

          overdue: [
            {
              $match: {
                dueDate: { $lt: new Date() },
                status: { $ne: "done" },
              },
            },
            { $count: "count" },
          ],

          total: [{ $count: "count" }],

          // Tasks grouped by assignee, with the username resolved
          byAssignee: [
            {
              $group: {
                _id: "$assignee",
                count: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $project: {
                name: {
                  $ifNull: [
                    { $arrayElemAt: ["$user.username", 0] },
                    "Unassigned",
                  ],
                },
                count: 1,
              },
            },
          ],

          // How many tasks were created on each of the last 14 days
          createdDaily: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
          ],

          // How many tasks were last touched (approx = completed) on each of the last 14 days, while done
          doneDaily: [
            {
              $match: {
                status: "done",
                updatedAt: {
                  $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
                },
                count: { $sum: 1 },
              },
            },
          ],
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

    // Build a 14-day cumulative trend for the "task completion over time" chart
    const dayKey = (d) => d.toISOString().slice(0, 10);

    const createdMap = toCountMap(
      result.createdDaily.map((r) => ({ _id: r._id, count: r.count }))
    );
    const doneMap = toCountMap(
      result.doneDaily.map((r) => ({ _id: r._id, count: r.count }))
    );

    let runningCreated = 0;
    let runningDone = 0;
    const completionTrend = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = dayKey(d);
      runningCreated += createdMap[key] || 0;
      runningDone += doneMap[key] || 0;
      completionTrend.push({
        date: key.slice(5), // MM-DD, shorter for the x-axis
        complete: runningDone,
        incomplete: Math.max(runningCreated - runningDone, 0),
      });
    }

    const tasksByAssignee = result.byAssignee.map((a) => ({
      name: a.name,
      count: a.count,
    }));

    res.status(200).json({
      totalTasks: total,

      completedTasks: completed,

      pendingTasks: total - completed,

      overdueTasks: result.overdue[0]?.count || 0,

      tasksByStatus: byStatus,

      tasksByPriority: toCountMap(result.byPriority),

      completionPercentage:
        total > 0 ? Math.round((completed / total) * 100) : 0,

      tasksByAssignee,

      completionTrend,
    });
  } catch (error) {
    console.error("Project dashboard error:", error.message);

    res.status(500).json({
      message: "Server error fetching project dashboard",
    });
  }
};


module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectDashboard,
};