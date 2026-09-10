const Notification = require("../models/Notifications");

// GET /api/notifications — latest 30 for the logged-in user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("project", "name");

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error.message);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.read = true;
    await notification.save();
    res.status(200).json(notification);
  } catch (error) {
    console.error("Mark notification read error:", error.message);
    res.status(500).json({ message: "Server error updating notification" });
  }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error.message);
    res.status(500).json({ message: "Server error updating notifications" });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };