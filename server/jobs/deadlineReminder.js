const cron = require("node-cron");
const Task = require("../models/Task");
const sendEmail = require("../utils/sendEmail");
const { deadlineReminderEmail } = require("../utils/emailTemplates");

// Runs once a day. Emails an assignee when their task is due within the
// next 24h ("upcoming") or already past its due date ("overdue"), and
// marks the task so the same reminder isn't sent again tomorrow. The
// remindedUpcoming/remindedOverdue flags get reset by taskController
// whenever dueDate/status/assignee actually changes.
const runDeadlineCheck = async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcoming = await Task.find({
    status: { $ne: "done" },
    dueDate: { $gte: now, $lte: in24h },
    remindedUpcoming: false,
    assignee: { $ne: null },
  }).populate("assignee", "username email");

  const overdue = await Task.find({
    status: { $ne: "done" },
    dueDate: { $lt: now },
    remindedOverdue: false,
    assignee: { $ne: null },
  }).populate("assignee", "username email");

  for (const task of upcoming) {
    try {
      await sendEmail({ to: task.assignee.email, ...deadlineReminderEmail(task, task.assignee.username, false) });
    } catch (error) {
      console.error(`Upcoming-deadline email failed for task ${task._id}:`, error.message);
    }
    task.remindedUpcoming = true;
    await task.save();
  }

  for (const task of overdue) {
    try {
      await sendEmail({ to: task.assignee.email, ...deadlineReminderEmail(task, task.assignee.username, true) });
    } catch (error) {
      console.error(`Overdue email failed for task ${task._id}:`, error.message);
    }
    task.remindedOverdue = true;
    await task.save();
  }

  console.log(`Deadline check: ${upcoming.length} upcoming, ${overdue.length} overdue reminder(s) sent`);
};

// Every day at 08:00 server time.
const startDeadlineCron = () => {
  cron.schedule("0 8 * * *", runDeadlineCheck);
};

module.exports = { startDeadlineCron, runDeadlineCheck };