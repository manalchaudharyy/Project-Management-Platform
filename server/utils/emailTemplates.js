// Small helpers that build the { subject, html } shape sendEmail() expects.
// Kept in the same plain, inline-paragraph style as the emails already sent
// from authController.js (no extra styling framework).

const frontendUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();

const taskAssignmentEmail = (task, assigneeName) => ({
  subject: `New task assigned: ${task.title}`,
  html: `<p>Hi ${assigneeName},</p>
         <p>You've been assigned a new task: <strong>${task.title}</strong></p>
         ${task.description ? `<p>${task.description}</p>` : ""}
         <p>Priority: <strong>${task.priority}</strong>${
    task.dueDate ? ` &middot; Due: <strong>${new Date(task.dueDate).toDateString()}</strong>` : ""
  }</p>
         <p><a href="${frontendUrl()}/tasks/${task._id}">View task</a></p>`,
});

const deadlineReminderEmail = (task, assigneeName, overdue) => ({
  subject: overdue ? `Overdue: ${task.title}` : `Deadline approaching: ${task.title}`,
  html: `<p>Hi ${assigneeName},</p>
         <p>${
           overdue
             ? `The task <strong>${task.title}</strong> is now overdue (was due ${new Date(task.dueDate).toDateString()}).`
             : `The task <strong>${task.title}</strong> is due on ${new Date(task.dueDate).toDateString()}.`
         }</p>
         <p><a href="${frontendUrl()}/tasks/${task._id}">View task</a></p>`,
});

const mentionEmail = (task, mentionedByName, commentText) => ({
  subject: `You were mentioned in a comment on: ${task.title}`,
  html: `<p><strong>${mentionedByName}</strong> mentioned you in a comment on <strong>${task.title}</strong>:</p>
         <blockquote style="margin:8px 0;padding-left:12px;border-left:3px solid #ccc;color:#555;">${commentText}</blockquote>
         <p><a href="${frontendUrl()}/tasks/${task._id}">View task</a></p>`,
});

const projectInvitationEmail = (projectName, inviterName) => ({
  subject: `You've been added to ${projectName}`,
  html: `<p><strong>${inviterName}</strong> added you to the project <strong>${projectName}</strong>.</p>
         <p><a href="${frontendUrl()}/projects">View project</a></p>`,
});

module.exports = {
  taskAssignmentEmail,
  deadlineReminderEmail,
  mentionEmail,
  projectInvitationEmail,
};