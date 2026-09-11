# Voxel — MERN Project Management Platform

A Trello/Jira-inspired project management platform built with the MERN stack. Teams can create projects, manage tasks on a live Kanban board, chat in real time, and use built-in AI to generate tasks, break down work, and summarize project health.

---

## ✨ Features

### Core
- **Authentication** — JWT-based login, bcrypt password hashing, public self-registration
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
│       ├── store/        # Redux Toolkit store & slices
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

## 🚀 Getting Started (local development)

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

Copy the example env file and fill in real values:
```bash
cp server/.env.example .env
```

Required variables (see `server/.env.example` for the full, commented list):

| Variable      | Required | Description                                         |
|---------------|:--------:|------------------------------------------------------|
| `PORT`        | No       | Backend port (defaults to `5000`)                    |
| `MONGO_URI`   | Yes      | MongoDB connection string                            |
| `JWT_SECRET`  | Yes      | Secret used to sign JWTs — use a long random string  |
| `GROQ_API_KEY`| Yes      | API key for Groq, powers all AI features             |
| `CLIENT_URL`  | Yes      | Comma-separated list of allowed frontend origins (CORS + Socket.io) |

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
The app will run on `http://localhost:5173`. The Vite dev server proxies `/api` and `/socket.io` requests to the backend automatically — no extra config needed for local development (see `client/.env.example` for the production build variables).

### 4. Open the app
Visit `http://localhost:5173` in your browser, or use **Sign up** on the login screen to create the first account.

---

## 👥 User Roles

| Role      | Permissions |
|-----------|-------------|
| **Admin** | Full access to every project on the platform, manage all users, assign roles |
| **PM**    | Create projects, create tasks, manage members, create/manage other users |
| **Member**| View assigned projects, update task status/priority, comment, chat |

New accounts can either self-register from the **Sign up** page (always created as `member`), or be provisioned as `member`/`pm` by an Admin or PM from the **Manage Users** page.

---

## 📡 API Reference (selected endpoints)

**Auth** — `/api/auth`
- `POST /register` — public self-signup
- `POST /login`
- `GET /me` — current user (protected)
- `POST /logout`, `POST /refresh`
- `POST /forgot-password`, `POST /reset-password/:token`, `PUT /change-password`

**Projects** — `/api/projects`
- `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
- `POST /:id/members`, `DELETE /:id/members`
- `GET /:id/dashboard`

**Tasks** — `/api/tasks`
- `GET /` (supports `status`, `priority`, `assignee`, `project`, `search`, `sortBy`, `page`, `limit` query params)
- `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`

**Comments** — `/api/comments` and `/api/tasks/:taskId/comments`
- `GET /tasks/:taskId/comments`, `POST /tasks/:taskId/comments`
- `PUT /comments/:id`, `DELETE /comments/:id`

**AI Assistant** (protected, requires project/task access)
- `POST /api/projects/:id/ai/generate-tasks` — `{ prompt }` → suggested tasks
- `POST /api/tasks/:id/ai/breakdown` — split a task into subtasks
- `GET /api/projects/:id/ai/summary` — plain-language project health summary
- `GET /api/projects/:id/ai/risks` — flagged risks + suggested actions

**Users** — `/api/users` (admin/PM only)
- `GET /`, `POST /`, `PUT /:id/role`, `DELETE /:id` (admin only)

---

## 🧪 Manual Testing Checklist

The following flows have been manually verified:

- [ ] Register a new account and confirm you land in the app as a `member`
- [ ] Register/login as each role and confirm permission boundaries
- [ ] Create a project, add/remove members
- [ ] Create, edit, and delete tasks
- [ ] Drag a task across Kanban columns and confirm it persists
- [ ] Open a project's board in two browser tabs and confirm live updates appear in both
- [ ] Add, edit, and delete a comment
- [ ] Generate tasks, a task breakdown, a project summary, and a risk report via AI
- [ ] Confirm a user who is not a project member/owner/admin gets a 403 from the AI endpoints for that project
- [ ] Send a real-time chat message between two users
- [ ] Confirm session timeout logs an inactive user out

> No automated test suite yet (`npm test` is a placeholder) — this is a known gap, see below.

---

## 🌐 Deployment

This is a two-part deployment: the Express/Socket.io backend and the Vite/React frontend are deployed **separately**, on two different origins.

### Backend (e.g. Render, Railway, Fly.io)
1. Deploy the repository root (start command: `npm start`, or `node server/server.js`).
2. Set the environment variables from `server/.env.example` in your host's dashboard — most importantly `MONGO_URI`, `JWT_SECRET`, `GROQ_API_KEY`, and `CLIENT_URL` (set this to your deployed frontend's URL once you have it).
3. Note the backend's public URL, e.g. `https://your-backend.onrender.com`.

### Frontend (e.g. Vercel, Netlify)
1. Set the build root to `client/`, build command `npm run build`, output directory `dist`.
2. Set the environment variables from `client/.env.example`, pointing at your backend's URL from the step above (`VITE_API_URL`, `VITE_SOCKET_URL`).
3. Deploy, then note the frontend's public URL and update `CLIENT_URL` on the backend to match (so CORS allows it).

### Live URLs
- Frontend: _add your deployed URL here_
- Backend / API: _add your deployed URL here_
- Test credentials (if applicable): _add here_

---

## 🗺 Known Limitations / Future Improvements

- No automated test suite yet (manual testing only) — a good next step would be Jest/Supertest for the API and Vitest/RTL for the frontend
- Password-reset emails are currently only logged to the server console (`server/utils/sendEmail.js`) rather than actually sent — wire up a real provider (nodemailer + SMTP, or a transactional email API) before relying on this in production
- No caching layer — not needed at current scale, but AI endpoints would benefit from it under heavier use
- No rate limiting on AI endpoints yet

---

## 📄 License

Not currently licensed for reuse.