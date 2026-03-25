/**
 * server.js
 * Entry point: loads environment variables and starts the HTTP server.
 */

import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`telemedicine-service running on port ${PORT}`);
});