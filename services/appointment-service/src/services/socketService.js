import { Server } from "socket.io";

let io = null;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    socket.on("register", (userId) => {
      if (userId) socket.join(`user_${userId}`);
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
  return io;
}

export function emitAppointmentUpdate(
  appointment,
  eventType = "appointment_updated",
) {
  if (!io) return;
  io.to(`user_${appointment.patientUserId}`).emit(eventType, appointment);
  io.to(`user_${appointment.doctorUserId}`).emit(eventType, appointment);
  io.emit("appointment_broadcast", { type: eventType, data: appointment });
}
