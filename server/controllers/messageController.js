const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { getIO, userRoom } = require("../socket");

const serializeUser = (u) =>
  u && { id: u._id, username: u.username, email: u.email, role: u.role };

// GET /api/messages/contacts — anyone can message anyone else in the workspace
const getContacts = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select(
      "username email role"
    );
    res.status(200).json(users.map(serializeUser));
  } catch (error) {
    console.error("Get contacts error:", error.message);
    res.status(500).json({ message: "Server error fetching contacts" });
  }
};

// GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate("participants", "username email role")
      .sort({ updatedAt: -1 });

    const result = await Promise.all(
      conversations.map(async (c) => {
        const unreadCount = await Message.countDocuments({
          conversation: c._id,
          sender: { $ne: req.user.id },
          readBy: { $ne: req.user.id },
        });
        const other = c.participants.find((p) => p._id.toString() !== req.user.id);

        return {
          id: c._id,
          otherUser: serializeUser(other),
          lastMessageText: c.lastMessageText,
          lastMessageAt: c.lastMessageAt,
          unreadCount,
        };
      })
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Get conversations error:", error.message);
    res.status(500).json({ message: "Server error fetching conversations" });
  }
};

// POST /api/messages/conversations  { userId }
const startConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (userId === req.user.id) {
      return res
        .status(400)
        .json({ message: "Cannot start a conversation with yourself" });
    }

    const otherUser = await User.findById(userId).select("username email role");
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, userId],
      });
    }

    res.status(200).json({
      id: conversation._id,
      otherUser: serializeUser(otherUser),
      lastMessageText: conversation.lastMessageText,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Start conversation error:", error.message);
    res.status(500).json({ message: "Server error starting conversation" });
  }
};

// GET /api/messages/conversations/:id/messages
const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!conversation.participants.some((p) => p.toString() === req.user.id)) {
      return res
        .status(403)
        .json({ message: "Forbidden: not part of this conversation" });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .populate("sender", "username email role");

    // Mark everything sent by the other person as read now that this user opened the thread.
    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.user.id },
        readBy: { $ne: req.user.id },
      },
      { $addToSet: { readBy: req.user.id } }
    );

    res.status(200).json(
      messages.map((m) => ({
        id: m._id,
        conversation: m.conversation,
        sender: serializeUser(m.sender),
        text: m.text,
        createdAt: m.createdAt,
      }))
    );
  } catch (error) {
    console.error("Get messages error:", error.message);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

// POST /api/messages/conversations/:id/messages  { text }
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!conversation.participants.some((p) => p.toString() === req.user.id)) {
      return res
        .status(403)
        .json({ message: "Forbidden: not part of this conversation" });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      text: text.trim(),
      readBy: [req.user.id],
    });

    conversation.lastMessageText = message.text;
    conversation.lastMessageSender = req.user.id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const sender = await User.findById(req.user.id).select("username email role");

    const payload = {
      id: message._id,
      conversation: conversation._id,
      sender: serializeUser(sender),
      text: message.text,
      createdAt: message.createdAt,
    };

    // Push to every participant's personal room in real time (sender included,
    // so their other open tabs stay in sync too).
    const io = getIO();
    conversation.participants.forEach((p) => {
      io.to(userRoom(p.toString())).emit("message:new", payload);
    });

    res.status(201).json(payload);
  } catch (error) {
    console.error("Send message error:", error.message);
    res.status(500).json({ message: "Server error sending message" });
  }
};

module.exports = {
  getContacts,
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
};