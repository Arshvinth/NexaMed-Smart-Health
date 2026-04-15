import dotenv from "dotenv";
import http from "http";
import app, { socketProxy } from "./app.js";

dotenv.config();

const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Handle WebSocket upgrade requests for Socket.IO
server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/socket.io/")) {
    socketProxy.upgrade(req, socket, head);
  } else {
    socket.destroy(); // reject other upgrade attempts
  }
});

server.listen(port, () => {
  console.log(`[api-gateway] running on port ${port}`);
});
