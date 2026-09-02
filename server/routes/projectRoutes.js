const express = require("express");
const router = express.Router();
const { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember, removeMember, getProjectDashboard } = require("../controllers/projectController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("admin", "pm"), createProject);
router.get("/", protect, getProjects);
router.get("/:id", protect, getProjectById);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

router.post("/:id/members", protect, addMember);
router.delete("/:id/members", protect, removeMember);
router.get("/:id/dashboard", protect, getProjectDashboard);
module.exports = router;