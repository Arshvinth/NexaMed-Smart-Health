import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

export function useWebSocket(userId) {
  const socketRef = useRef(null);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("register", userId);
    });

    socket.on("appointment_created", (data) =>
      setLastEvent({ type: "created", data }),
    );
    socket.on("appointment_confirmed", (data) =>
      setLastEvent({ type: "confirmed", data }),
    );
    socket.on("appointment_cancelled", (data) =>
      setLastEvent({ type: "cancelled", data }),
    );
    socket.on("appointment_rescheduled", (data) =>
      setLastEvent({ type: "rescheduled", data }),
    );
    socket.on("appointment_completed", (data) =>
      setLastEvent({ type: "completed", data }),
    );

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return { lastEvent };
}
