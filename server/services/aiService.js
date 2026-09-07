// server/services/aiService.js
const axios = require("axios");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

// This is the instruction we give the AI every time.
// It tells it exactly what shape of JSON we want back.
const SYSTEM_PROMPT = `You are a project management assistant.
Given a high-level project requirement from a user, break it down into a list of concrete tasks.

Respond with ONLY valid JSON, no other text, no markdown code fences.
The JSON must be an array of task objects, each with exactly these fields:
- title (string, short)
- description (string, 1-2 sentences)
- priority (one of: "low", "medium", "high", "critical")
- suggestedStatus (one of: "todo", "in-progress", "review", "done")
- estimatedEffort (string, e.g. "2 hours", "1 day", "3 days")
- suggestedDueDate (string, ISO date format YYYY-MM-DD, relative to today, ${new Date().toISOString().split("T")[0]})

Generate between 5 and 10 tasks. Return ONLY the JSON array, nothing else.`;

async function generateTasksFromPrompt(userPrompt) {
  const response = await axios.post(
    GROQ_URL,
    {
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const rawText = response.data.choices[0].message.content;

  // The AI sometimes wraps JSON in ```json ... ``` even when told not to.
  // Strip that off before parsing, just in case.
  const cleanedText = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let tasks;
  try {
    tasks = JSON.parse(cleanedText);
  } catch (err) {
    throw new Error("AI returned text that wasn't valid JSON: " + rawText);
  }

  if (!Array.isArray(tasks)) {
    throw new Error("AI response was not a JSON array");
  }

  return tasks;
}

module.exports = { generateTasksFromPrompt };