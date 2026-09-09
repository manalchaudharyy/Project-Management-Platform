import { io } from "socket.io-client";

let socket = null;

// Connects (or reuses) a single socket for the given token.
// Safe to call from multiple components — it won't open duplicate connections.
export const getSocket = (token) => {
  if (!token) return null;

  if (socket && socket.auth?.token === token && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io("/", {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};