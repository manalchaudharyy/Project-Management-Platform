const Comment = require("../models/Comment");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const sendEmail = require("../utils/sendEmail");
const { mentionEmail } = require("../utils/emailTemplates");

// Finds @username mentions in a comment's text and emails each mentioned
// user (skipping the commenter themself and any @handle that isn't a real
// username). Fire-and-forget — a failed email must never fail the comment.
const notifyMentions = async (content, task, authorId, authorUsername) => {
  if (!content) return;

  const usernames = [...new Set([...content.matchAll(/@(\w+)/g)].map((m) => m[1]))];
  if (usernames.length === 0) return;

  const mentionedUsers = await User.find({ username: { $in: usernames } });

  for (const user of mentionedUsers) {
    if (user._id.toString() === authorId) continue; // don't notify yourself
    sendEmail({ to: user.email, ...mentionEmail(task, authorUsername, content) }).catch(
      (error) => console.error(`Mention email failed for ${user.email}:`, error.message)
    );
  }
};

// Shared access check: a user can view/comment on a task if they're an
// admin, or they're the project's owner/a project member.
const canAccessTask = async (task, user) => {
  if (user.role === "admin") return true;

  const project = await Project.findById(task.project);
  if (!project) return false;

  const isOwner = project.owner.toString() === user.id;
  const isMember = project.members.some((m) => m.toString() === user.id);

  return isOwner || isMember;
};

// GET /tasks/:taskId/comments
const getComments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const allowed = await canAccessTask(task, req.user);
    if (!allowed) {
      return res.status(403).json({ message: "Forbidden: you don't have access to this task" });
    }

    const comments = await Comment.find({ task: task._id })
      .sort({ createdAt: 1 })
      .populate("author", "username");
    res.status(200).json(comments);
  } catch (error) {
    console.error("Get comments error:", error.message);
    res.status(500).json({ message: "Server error fetching comments" });
  }
};

// POST /tasks/:taskId/comments
const createComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const allowed = await canAccessTask(task, req.user);
    if (!allowed) {
      return res.status(403).json({ message: "Forbidden: you don't have access to this task" });
    }

    const { content } = req.body;
    const hasFile = !!req.file;

    if ((!content || !content.trim()) && !hasFile) {
      return res.status(400).json({ message: "Comment content or an attachment is required" });
    }

    const attachments = [];
    if (hasFile) {
      const streamUpload = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "comment_attachments" },
            (error, result) => (result ? resolve(result) : reject(error))
          );
          stream.end(req.file.buffer);
        });

      const result = await streamUpload();
      attachments.push({
        filename: req.file.originalname,
        url: result.secure_url,
      });
    }

    const comment = await Comment.create({
      content: content || "",
      author: req.user.id,
      task: task._id,
      attachments,
    });
    await comment.populate("author", "username");

    notifyMentions(content, task, req.user.id, comment.author.username);

    res.status(201).json(comment);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Create comment error:", error.message);
    res.status(500).json({ message: "Server error creating comment" });
  }
};

// PUT /comments/:id
const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: you can only edit your own comments" });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    comment.content = content;
    await comment.save();
    await comment.populate("author", "username");
    res.status(200).json(comment);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Update comment error:", error.message);
    res.status(500).json({ message: "Server error updating comment" });
  }
};

// DELETE /comments/:id
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: you can only delete your own comments" });
    }

    await comment.deleteOne();
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error.message);
    res.status(500).json({ message: "Server error deleting comment" });
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment };