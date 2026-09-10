const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const BlacklistedToken = require("./models/BlacklistedToken");

let io = null;

// Every connected client joins a room named after their own user id.
// To push something to a specific user in real time, emit to `user:${userId}`.
const userRoom = (userId) => `user:${userId}`;

// Every client viewing a project's Kanban board joins a room named after
// that project. To push a live board update to everyone looking at it,
// emit to `project:${projectId}`.
const projectRoom = (projectId) => `project:${projectId}`;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  // Authenticate the socket the same way REST routes do — a JWT, but passed
  // via the handshake instead of an Authorization header.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Not authorized, no token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.jti) {
        const revoked = await BlacklistedToken.findOne({ jti: decoded.jti });
        if (revoked) return next(new Error("Not authorized, token has been revoked"));
      }

      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Not authorized, token failed or expired"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.userId));

    // Relay a typing indicator to the other participant only.
    socket.on("typing", ({ conversationId, recipientId, isTyping }) => {
      if (!conversationId || !recipientId) return;
      io.to(userRoom(recipientId)).emit("typing", {
        conversationId,
        userId: socket.userId,
        isTyping: !!isTyping,
      });
    });

    // Kanban board: client asks to "watch" a project's live updates while
    // that board is open, and stops watching when it leaves the page.
    socket.on("joinProject", (projectId) => {
      if (!projectId) return;
      socket.join(projectRoom(projectId));
    });

    socket.on("leaveProject", (projectId) => {
      if (!projectId) return;
      socket.leave(projectRoom(projectId));
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io has not been initialized yet");
  return io;
};

// Broadcasts a task change to everyone currently viewing that project's
// board. Safe to call even before a socket has connected — it's a no-op
// until io is initialized.
const emitToProject = (projectId, event, payload) => {
  if (!io || !projectId) return;
  io.to(projectRoom(projectId)).emit(event, payload);
};

module.exports = { initSocket, getIO, userRoom, projectRoom, emitToProject };