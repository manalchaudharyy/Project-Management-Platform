const Task = require("../models/Task");
const Project = require("../models/Project");

const TASK_STATUS_VALUES = ["todo", "in-progress", "review", "done"];
const TASK_PRIORITY_VALUES = ["low", "medium", "high", "critical"];

const createTask = async (req, res) => {
  try {
    const { title, description, project, assignee, priority, dueDate, status } = req.body;

    if (!title || !title.trim() || !project) {
      return res.status(400).json({ message: "Title and project are required" });
    }

    if (priority !== undefined && !TASK_PRIORITY_VALUES.includes(priority)) {
      return res.status(400).json({
        message: `priority must be one of: ${TASK_PRIORITY_VALUES.join(", ")}`,
      });
    }

    if (status !== undefined && !TASK_STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${TASK_STATUS_VALUES.join(", ")}`,
      });
    }

    if (dueDate !== undefined && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ message: "dueDate must be a valid date" });
    }

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: "Project not found" });
    }

    const task = await Task.create({
      title,
      description,
      project,
      // A dropdown's "Unassigned" option posts an empty string, which Mongoose
      // would otherwise try (and fail) to cast to an ObjectId.
      assignee: assignee ? assignee : undefined,
      priority,
      status,
      dueDate,
    });

    await task.populate({ path: "assignee", select: "username email" });

    res.status(201).json(task);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Create task error:", error.message);
    res.status(500).json({ message: "Server error creating task" });
  }
};

const getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.project) filter.project = req.query.project;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignee) filter.assignee = req.query.assignee;
    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filter.$or = [{ title: regex }, { description: regex }];
    }

    if (req.user.role === "member") {
      const userProjects = await Project.find({
        $or: [{ owner: req.user.id }, { members: req.user.id }],
      }).select("_id");
      const userProjectIds = userProjects.map((p) => p._id.toString());

      if (req.query.project) {
        if (!userProjectIds.includes(req.query.project)) {
          return res.status(200).json([]);
        }
      } else {
        filter.project = { $in: userProjectIds };
      }

      // Members only see tasks assigned to them, or unassigned tasks they
      // could pick up — never tasks assigned to other members.
      // This overrides any ?assignee= query param a member might pass.
      delete filter.assignee;
      filter.$and = [
        {
          $or: [
            { assignee: req.user.id },
            { assignee: null },
            { assignee: { $exists: false } },
          ],
        },
      ];
      if (filter.$or) {
        // the search filter above also uses $or — merge both into $and
        filter.$and.push({ $or: filter.$or });
        delete filter.$or;
      }
    }

    let sort = { createdAt: -1 };
    if (req.query.sortBy) {
      const field = req.query.sortBy.replace(/^-/, "");
      const direction = req.query.sortBy.startsWith("-") ? -1 : 1;
      sort = { [field]: direction };
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const [tasks, totalCount] = await Promise.all([
      Task.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({ path: "assignee", select: "username email" }),
      Task.countDocuments(filter),
    ]);

    res.status(200).json({
      data: tasks,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get tasks error:", error.message);
    res.status(500).json({ message: "Server error fetching tasks" });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate({
      path: "assignee",
      select: "username email",
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error("Get task by id error:", error.message);
    res.status(500).json({ message: "Server error fetching task" });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssignee = task.assignee && task.assignee.toString() === req.user.id;
    const isPmOrAdmin = req.user.role === "pm" || req.user.role === "admin";

    if (!isAssignee && !isPmOrAdmin) {
      return res.status(403).json({ message: "Forbidden: only the assignee or a PM/Admin can update this task" });
    }

    let { title, description, status, priority, dueDate, assignee } = req.body;

    // A dropdown's "Unassigned" option posts an empty string; normalize that
    // to null so it clears the assignee instead of failing ObjectId cast.
    if (assignee === "") {
      assignee = null;
    }

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ message: "Task title cannot be empty" });
    }
    if (status !== undefined && !TASK_STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${TASK_STATUS_VALUES.join(", ")}`,
      });
    }
    if (priority !== undefined && !TASK_PRIORITY_VALUES.includes(priority)) {
      return res.status(400).json({
        message: `priority must be one of: ${TASK_PRIORITY_VALUES.join(", ")}`,
      });
    }
    if (dueDate !== undefined && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ message: "dueDate must be a valid date" });
    }

    const trackableFields = ["title", "description", "status", "priority", "dueDate", "assignee"];
    const incoming = { title, description, status, priority, dueDate, assignee };
    const historyEntries = [];

    const applyChange = (field) => {
      const newValue = incoming[field];
      if (newValue === undefined) return;

      const oldValue = task[field];
      const oldComparable = oldValue instanceof Date ? oldValue.toISOString() : oldValue;
      const newComparable = field === "dueDate" ? new Date(newValue).toISOString() : newValue;

      if (String(oldComparable ?? "") === String(newComparable ?? "")) return;

      historyEntries.push({
        field,
        oldValue: oldValue ?? null,
        newValue: newValue,
        changedBy: req.user.id,
        changedAt: new Date(),
      });

      task[field] = newValue;
    };

    if (req.user.role === "member") {
      applyChange("status");
    } else {
      trackableFields.forEach(applyChange);
    }

    if (historyEntries.length > 0) {
      task.history.push(...historyEntries);
    }

    const updatedTask = await task.save();
    await updatedTask.populate({ path: "assignee", select: "username email" });
    res.status(200).json(updatedTask);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Update task error:", error.message);
    res.status(500).json({ message: "Server error updating task" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isPmOrAdmin = req.user.role === "pm" || req.user.role === "admin";

    if (!isPmOrAdmin) {
      return res.status(403).json({ message: "Forbidden: only a PM/Admin can delete this task" });
    }

    await task.deleteOne();
    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error.message);
    res.status(500).json({ message: "Server error deleting task" });
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };