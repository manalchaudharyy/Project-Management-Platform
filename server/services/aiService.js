// server/services/aiService.js
const axios = require("axios");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

// Shared helper — both generate and breakdown use this to call Groq
// and parse the response the same way.
async function callGroqForTasks(systemPrompt, userPrompt) {
  const response = await axios.post(
    GROQ_URL,
    {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
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

// This is the instruction we give the AI every time.
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
  return callGroqForTasks(SYSTEM_PROMPT, userPrompt);
}

// New: breaks an EXISTING task into smaller sub-tasks
const BREAKDOWN_SYSTEM_PROMPT = `You are a project management assistant.
Given an existing task's title and description, break it down into smaller, concrete sub-tasks needed to complete it.

Respond with ONLY valid JSON, no other text, no markdown code fences.
The JSON must be an array of task objects, each with exactly these fields:
- title (string, short)
- description (string, 1-2 sentences)
- priority (one of: "low", "medium", "high", "critical")
- suggestedStatus (one of: "todo", "in-progress", "review", "done")
- estimatedEffort (string, e.g. "2 hours", "1 day", "3 days")
- suggestedDueDate (string, ISO date format YYYY-MM-DD, relative to today, ${new Date().toISOString().split("T")[0]})

Generate between 4 and 8 sub-tasks. Return ONLY the JSON array, nothing else.`;

async function breakdownTask(taskTitle, taskDescription) {
  const userPrompt = `Task: ${taskTitle}${
    taskDescription ? `\nDescription: ${taskDescription}` : ""
  }`;
  return callGroqForTasks(BREAKDOWN_SYSTEM_PROMPT, userPrompt);
}

// New: plain-text summary generation (not a JSON task list, just a paragraph)
async function callGroqForText(systemPrompt, userPrompt) {
  const response = await axios.post(
    GROQ_URL,
    {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
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

  return response.data.choices[0].message.content.trim();
}

const SUMMARY_SYSTEM_PROMPT = `You are a project management assistant.
Given statistics about a project's tasks, write a short status summary (3-5 sentences).
Mention: overall completion percentage, how many tasks are done vs total, how many high/critical priority tasks remain, and how many tasks are overdue (if any).
Write in plain text, no markdown, no bullet points, no headings — just a short paragraph a project manager could read at a glance.`;

async function generateSummary(stats) {
  const userPrompt = `Project stats:
Total tasks: ${stats.total}
Completed tasks: ${stats.completed}
Pending tasks: ${stats.pending}
Overdue tasks: ${stats.overdue}
High priority tasks remaining: ${stats.highPriorityRemaining}
Critical priority tasks remaining: ${stats.criticalPriorityRemaining}
Completion percentage: ${stats.completionPercent}%`;

  return callGroqForText(SUMMARY_SYSTEM_PROMPT, userPrompt);
}

module.exports = { generateTasksFromPrompt, breakdownTask, generateSummary };