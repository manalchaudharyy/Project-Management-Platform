const Task = require("../models/Task");
const {
  generateTasksFromPrompt,
  breakdownTask,
  generateSummary,
  generateRiskAnalysis,
} = require("../services/aiService");

const generateTasks = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const tasks = await generateTasksFromPrompt(prompt);

    res.status(200).json({ tasks });
  } catch (error) {
    console.error("AI task generation error:", error.message);
    res.status(500).json({ message: "Failed to generate tasks", error: error.message });
  }
};

// New: breaks down an existing task by its id
const breakdownExistingTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const subtasks = await breakdownTask(task.title, task.description);

    res.status(200).json({ tasks: subtasks });
  } catch (error) {
    console.error("AI task breakdown error:", error.message);
    res.status(500).json({ message: "Failed to break down task", error: error.message });
  }
};

// New: builds simple task stats for a project, then asks the AI to
// summarize them into a short status paragraph.
const getProjectSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ project: projectId });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const pending = total - completed;

    const now = new Date();
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
    ).length;

    const highPriorityRemaining = tasks.filter(
      (t) => t.priority === "high" && t.status !== "done"
    ).length;
    const criticalPriorityRemaining = tasks.filter(
      (t) => t.priority === "critical" && t.status !== "done"
    ).length;

    const completionPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const stats = {
      total,
      completed,
      pending,
      overdue,
      highPriorityRemaining,
      criticalPriorityRemaining,
      completionPercent,
    };

    const summary = await generateSummary(stats);

    res.status(200).json({ summary, stats });
  } catch (error) {
    console.error("AI project summary error:", error.message);
    res.status(500).json({ message: "Failed to generate summary", error: error.message });
  }
};

// New: analyzes overdue/high-priority/upcoming-deadline tasks and assignee
// load, then asks the AI to flag risks and suggest actions.
const getProjectRisks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ project: projectId })
      .populate("assignee", "username");

    const openTasks = tasks.filter((t) => t.status !== "done");
    const total = tasks.length;
    const completed = tasks.length - openTasks.length;
    const completionPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const now = new Date();
    const overdueTasks = openTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now);

    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = openTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= threeDaysFromNow
    ).length;

    const highPriorityRemaining = openTasks.filter((t) => t.priority === "high").length;
    const criticalPriorityRemaining = openTasks.filter((t) => t.priority === "critical").length;

    // Count open tasks per assignee, to flag anyone overloaded
    const loadMap = {};
    openTasks.forEach((t) => {
      const name = t.assignee?.username || "Unassigned";
      loadMap[name] = (loadMap[name] || 0) + 1;
    });
    const loadByAssignee = Object.entries(loadMap).map(([name, count]) => ({ name, count }));

    const riskData = {
      total,
      completionPercent,
      overdue: overdueTasks.length,
      overdueTitles: overdueTasks.slice(0, 5).map((t) => t.title),
      highPriorityRemaining,
      criticalPriorityRemaining,
      loadByAssignee,
      upcomingDeadlines,
    };

    const analysis = await generateRiskAnalysis(riskData);

    res.status(200).json({
      risks: analysis.risks || [],
      suggestedActions: analysis.suggestedActions || [],
      riskData,
    });
  } catch (error) {
    console.error("AI risk detection error:", error.message);
    res.status(500).json({ message: "Failed to analyze risks", error: error.message });
  }
};

module.exports = { generateTasks, breakdownExistingTask, getProjectSummary, getProjectRisks };