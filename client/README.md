# Voxel — MERN Project Management Platform

A Trello/Jira-inspired project management platform built with the MERN stack. Teams can create projects, manage tasks on a live Kanban board, chat in real time, and use built-in AI to generate tasks, break down work, and summarize project health.

---

## ✨ Features

### Core
- **Authentication** — JWT-based login, bcrypt password hashing
- **Role-based access** — Admin, Project Manager, and Member roles with different permissions
- **Projects & Tasks** — full CRUD, with member management per project
- **Kanban board** — drag-and-drop tasks between To Do / In Progress / Review / Done
- **Comments** — add, edit, and delete comments on tasks
- **Search, filter, sort & pagination** — on the tasks list (backend-driven)
- **Dashboard** — charts and stats (tasks by status, by assignee, completion trend over time)

### Real-time
- **Live Kanban updates** — when a teammate moves, creates, or deletes a task, every open board updates instantly via Socket.io — no refresh needed
- **Direct messaging** — real-time chat between users, with typing indicators
- **Session timeout** — automatic logout after inactivity

### AI-powered (via Groq)
- **AI Task Generator** — describe a goal, get a list of suggested tasks
- **AI Task Breakdown** — split a task into smaller subtasks
- **AI Project Summary** — a plain-language health summary of a project
- **AI Risk Detection** — flags at-risk areas of a project (overdue work, bottlenecks, etc.)

> The Groq API key is only ever used on the backend — it is never exposed to the browser.

---

## 🛠 Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React (Vite), Redux Toolkit, Tailwind CSS, Recharts |
| Backend    | Node.js, Express |
| Database   | MongoDB with Mongoose |
| Auth       | JWT, bcrypt |
| Real-time  | Socket.io |
| AI         | Groq API (`openai/gpt-oss-20b`) |

---

## 📁 Project Structure

```
project-mgm/
├── client/              # React frontend (Vite)
│   └── src/
│       ├── pages/       # Route-level pages (Kanban, Dashboard, Projects, ...)
│       ├── components/  # Reusable UI components
│       ├── redux/       # Redux Toolkit store & slices
│       └── api/         # Axios client + Socket.io client
├── server/              # Express backend
│   ├── config/          # Database connection
│   ├── controllers/     # Route logic
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── middleware/      # Auth middleware, error handling
│   ├── services/        # AI service (Groq integration)
│   └── socket.js        # Socket.io setup
├── package.json         # Backend dependencies (installed from repo root)
└── README.md
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [MongoDB](https://www.mongodb.com/cloud/atlas) database (Atlas free tier works fine)
- A [Groq API key](https://console.groq.com/) (free tier available) — required for the AI features

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/manalchaudharyy/Project-Management-Platform.git
cd Project-Management-Platform
```

### 2. Set up the backend

Install dependencies from the **repository root** (the backend's `package.json` lives there):
```bash
npm install
```

Create a `.env` file in the **repository root** with:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```

Start the backend:
```bash
npm start
```
The API will run on `http://localhost:5000`.

### 3. Set up the frontend

In a **new terminal**, from the repository root:
```bash
cd client
npm install
npm run dev
```
The app will run on `http://localhost:5173`. The Vite dev server proxies `/api` and `/socket.io` requests to the backend automatically — no extra config needed.

### 4. Open the app
Visit `http://localhost:5173` in your browser.

---

## 🔑 Environment Variables

| Variable        | Required | Description                                      |
|------------------|:--------:|---------------------------------------------------|
| `PORT`           | No       | Backend port (defaults to `5000`)                 |
| `MONGO_URI`      | Yes      | MongoDB connection string                          |
| `JWT_SECRET`     | Yes      | Secret used to sign JWTs — use a long random string |
| `GROQ_API_KEY`   | Yes      | API key for Groq, powers all AI features            |

---

## 👥 User Roles

| Role      | Permissions |
|-----------|-------------|
| **Admin** | Full access to every project on the platform, manage all users, assign roles |
| **PM**    | Create projects, create tasks, manage members, create/manage other users |
| **Member**| View assigned projects, update task status/priority, comment, chat |

New accounts are created by an Admin or PM from the **Manage Users** page — there is currently no public self-signup flow.

---

## 🧪 Manual Testing Checklist

The following flows have been manually verified:

- [ ] Register/login as each role and confirm permission boundaries
- [ ] Create a project, add/remove members
- [ ] Create, edit, and delete tasks
- [ ] Drag a task across Kanban columns and confirm it persists
- [ ] Open a project's board in two browser tabs and confirm live updates appear in both
- [ ] Add, edit, and delete a comment
- [ ] Generate tasks, a task breakdown, a project summary, and a risk report via AI
- [ ] Send a real-time chat message between two users
- [ ] Confirm session timeout logs an inactive user out

---

## 🗺 Known Limitations / Future Improvements

- No public self-registration — accounts are admin/PM-provisioned only
- No automated test suite yet (manual testing only)
- No caching layer — not needed at current scale, but AI endpoints would benefit from it under heavier use
- No rate limiting on AI endpoints yet

---

## 📄 License

Not currently licensed for reuse.