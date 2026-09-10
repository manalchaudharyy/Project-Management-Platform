const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Comment = require("../models/Comment");

const ROLE_VALUES = ["member", "pm"]; // "admin" can no longer be assigned via this endpoint

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error.message);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !ROLE_VALUES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${ROLE_VALUES.join(", ")}` });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin roles cannot be changed here" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ id: user._id, username: user.username, email: user.email, role: user.role });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    console.error("Update user role error:", error.message);
    res.status(500).json({ message: "Server error updating user role" });
  }
};

// DELETE /api/users/:id (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    // Block deletion if this user still owns a project — deleting them would
    // leave that project with a broken/missing owner reference.
    const ownedProjectsCount = await Project.countDocuments({ owner: user._id });
    if (ownedProjectsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete this user — they still own ${ownedProjectsCount} project(s). Reassign or delete those projects first.`,
      });
    }

    // Clean up every place this user's id is referenced, so nothing is left
    // pointing at a user that no longer exists.
    await Promise.all([
      Project.updateMany({ members: user._id }, { $pull: { members: user._id } }),
      Task.updateMany({ assignee: user._id }, { $set: { assignee: null } }),
      Comment.deleteMany({ author: user._id }),
    ]);

    await user.deleteOne();
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error.message);
    res.status(500).json({ message: "Server error deleting user" });
  }
};

module.exports = { getUsers, updateUserRole, deleteUser };