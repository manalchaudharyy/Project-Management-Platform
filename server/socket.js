const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

// Every connected client joins a room named after their own user id.
// To push something to a specific user in real time, emit to `user:${userId}`.
const userRoom = (userId) => `user:${userId}`;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  // Authenticate the socket the same way REST routes do — a JWT, but passed
  // via the handshake instead of an Authorization header.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Not authorized, no token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io has not been initialized yet");
  return io;
};

module.exports = { initSocket, getIO, userRoom };