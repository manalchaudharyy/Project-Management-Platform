const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectDashboard,
} = require("../controllers/projectController");

const { protect, authorize } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

router.post("/", protect, authorize("admin", "pm"), createProject);
router.get("/", protect, getProjects);
router.get("/:id", protect, validateObjectId("id"), getProjectById);
router.put("/:id", protect, validateObjectId("id"), updateProject);
router.delete("/:id", protect, validateObjectId("id"), deleteProject);
router.post("/:id/members", protect, validateObjectId("id"), addMember);
router.delete("/:id/members", protect, validateObjectId("id"), removeMember);
router.get("/:id/dashboard", protect, validateObjectId("id"), getProjectDashboard);

module.exports = router;