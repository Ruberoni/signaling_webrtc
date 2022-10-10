import http from "http";
import { Server } from "socket.io";
import { logger } from "./logger";
import { socketListeners } from "./socketListeners";

const server: http.Server = new http.Server();
const io = new Server(server);
const port: number = 8080;

server.listen(port, () => {
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
