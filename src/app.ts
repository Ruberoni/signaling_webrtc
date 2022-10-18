import http from "http";
import express from "express";
import { Server } from "socket.io";
import { logger } from "./logger";
import { socketListeners } from "./socketListeners";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = parseInt(process.env.PORT) || 8080;

app.get("/", (req, res) => {
  res.send("Hello world");
});

server.listen(port, "0.0.0.0", () => {
  logger.info(`Listening on port ${port}`);
});

// type ServerOn = typeof io.on<"connection">

io.on("connection", (socket) => socketListeners.onSocketConnect(socket, io));

process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received.");
  closeSocketServer();
  process.exit(0);
});

function closeSocketServer(): void {
  if (io !== undefined) {
    logger.info("closing socket server");
    io.close();
  }
}
