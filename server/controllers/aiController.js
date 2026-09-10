const Task = require("../models/Task");
const { generateTasksFromPrompt, breakdownTask, generateSummary } = require("../services/aiService");

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

module.exports = { generateTasks, breakdownExistingTask, getProjectSummary };