const { generateTasksFromPrompt } = require("../services/aiService");
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

module.exports = { generateTasks };