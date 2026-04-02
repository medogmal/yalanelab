"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (socket && socket.connected) return socket;
  if (!socket) {
    try {
      // Connect to the custom server path
      socket = io({
        path: "/api/socket",
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 800,
      });
      
      socket.on("connect", () => {
        console.log("Socket connected:", socket?.id);
      });
      
      socket.on("disconnect", () => {
        console.log("Socket disconnected");
      });
      
      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
      });

    } catch (e) {
      console.error("Socket init error:", e);
      return null;
    }
  }
  return socket;
}

export function onSocketReady(cb: (s: Socket) => void) {
  const s = getSocket();
  if (!s) return;
  if (s.connected) cb(s);
  else s.once("connect", () => cb(s));
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function useSocket() {
  const [s, setS] = useState<Socket | null>(socket);
  const [isConnected, setIsConnected] = useState(socket?.connected || false);

  useEffect(() => {
    const socketInstance = getSocket();
    setS(socketInstance);
    
    function onConnect() {
      setIsConnected(true);
    }
    
    function onDisconnect() {
      setIsConnected(false);
    }

    if (socketInstance) {
      setIsConnected(socketInstance.connected);
      socketInstance.on("connect", onConnect);
      socketInstance.on("disconnect", onDisconnect);
    }

    return () => {
      if (socketInstance) {
        socketInstance.off("connect", onConnect);
        socketInstance.off("disconnect", onDisconnect);
      }
    };
  }, []);

  return { socket: s, isConnected };
}
