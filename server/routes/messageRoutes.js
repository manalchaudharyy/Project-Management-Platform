const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getContacts,
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
} = require("../controllers/messageController");

router.get("/contacts", protect, getContacts);
router.get("/conversations", protect, getConversations);
router.post("/conversations", protect, startConversation);
router.get("/conversations/:id/messages", protect, getMessages);
router.post("/conversations/:id/messages", protect, sendMessage);

module.exports = router;