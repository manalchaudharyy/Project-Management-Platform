import { io } from "socket.io-client";

// Same idea as axiosClient: relative "/" relies on the Vite dev proxy, so
// in production point this at the deployed backend's URL, e.g.:
// VITE_SOCKET_URL=https://your-backend.onrender.com
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "/";

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

  socket = io(SOCKET_URL, {
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