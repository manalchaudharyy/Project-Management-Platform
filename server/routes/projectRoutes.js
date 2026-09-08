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

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

/* Create project */
router.post(
  "/",
  protect,
  authorize("admin", "pm"),
  createProject
);

/* Get all accessible projects */
router.get(
  "/",
  protect,
  getProjects
);

/* Get single project */
router.get(
  "/:id",
  protect,
  getProjectById
);

/* Edit project */
router.put(
  "/:id",
  protect,
  updateProject
);

/* Delete project */
router.delete(
  "/:id",
  protect,
  deleteProject
);

/* Add member */
router.post(
  "/:id/members",
  protect,
  addMember
);

/* Remove member */
router.delete(
  "/:id/members",
  protect,
  removeMember
);

/* Project dashboard */
router.get(
  "/:id/dashboard",
  protect,
  getProjectDashboard
);

module.exports = router;