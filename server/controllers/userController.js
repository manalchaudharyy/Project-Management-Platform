const User = require("../models/User");

const ROLE_VALUES = ["member", "pm", "admin"];

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

    if (user._id.toString() === req.user.id && role !== "admin") {
      return res.status(400).json({ message: "You cannot change your own admin role" });
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

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await user.deleteOne();
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error.message);
    res.status(500).json({ message: "Server error deleting user" });
  }
};

module.exports = { getUsers, updateUserRole, deleteUser };