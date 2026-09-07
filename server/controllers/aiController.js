// server/controllers/aiController.js
const { generateTasksFromPrompt } = require("../services/aiService");

// POST /api/projects/:projectId/ai/generate-tasks
// Body: { prompt: "Build an e-commerce checkout system with Stripe" }
const generateTasks = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const tasks = await generateTasksFromPrompt(prompt);

    // NOTE: nothing is saved to the database here.
    // We just hand the suggestions back to the frontend for the user to review.
    res.status(200).json({ tasks });
  } catch (error) {
    console.error("AI task generation error:", error.message);
    res.status(500).json({ message: "Failed to generate tasks", error: error.message });
  }
};

module.exports = { generateTasks };