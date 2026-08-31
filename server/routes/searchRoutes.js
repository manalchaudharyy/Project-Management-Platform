const express = require("express");
const router = express.Router();
const { searchItems } = require("../controllers/searchController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, searchItems);

module.exports = router;