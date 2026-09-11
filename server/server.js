require("dotenv").config();
const http = require("http");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const searchRoutes = require("./routes/searchRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const notificationRoutes = require("./routes/notificationRouter");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const express = require("express");
const cors = require("cors");
const { initSocket } = require("./socket");
const app = express()
const PORT = process.env.PORT || 5000;
const aiRoutes = require("./routes/aiRoutes");

// CLIENT_URL supports a comma-separated list so both a local dev URL and a
// deployed frontend URL can be allowed at once, e.g.:
// CLIENT_URL=http://localhost:5173,https://your-frontend.vercel.app
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, Postman, server-to-server) which
      // have no Origin header at all.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/projects", aiRoutes);
app.use("/api/tasks", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/",(req,res)=>{
    res.send("Project Management API is running!");
});

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

connectDB();
server.listen(PORT,()=>{
    console.log(`Server is running on Port ${PORT}`);
});