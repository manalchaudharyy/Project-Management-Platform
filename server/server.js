require("dotenv").config();
const http = require("http");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const searchRoutes = require("./routes/searchRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const express = require("express");
const { initSocket } = require("./socket");
const app = express()
const PORT = process.env.PORT || 5000;
const aiRoutes = require("./routes/aiRoutes"); 
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