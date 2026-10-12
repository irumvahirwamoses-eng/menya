import { io } from "socket.io-client";
import { getToken } from "./api";

let socket = null;
const API_BASE = import.meta.env.VITE_API_URL || "";

export function getSocket() {
  if (socket?.connected) return socket;

  socket?.disconnect();
  socket = io(API_BASE, {
    auth: { token: getToken() },
    autoConnect: true,
    reconnectionAttempts: 8,
    path: "/socket.io",
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
