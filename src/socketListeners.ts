import { Server, Socket } from "socket.io";
import { socketMessages } from "./constants/socketMessages";
import { logger } from "./logger";

interface ICandidateMsg {
  label: number;
  id: string;
  candidate: string;
}

/**
 * Listeners for socket messages
 */
class SocketListeners {
  /**
   * onSocketConnect
   */
  public onSocketConnect(socket: Socket, io: Server): void {
    logger.info("a user connected");
    socket.on("disconnect", () => {
      logger.info("user disconnected");
    });

    socket.on(socketMessages.message, (message: string): void => {
      logger.info(`Client said: ${message}`);
      // for a real app, would be room-only (not broadcast)
      socket.broadcast.emit(socketMessages.message, message);
    });

    socket.on(
      socketMessages.iceCandidate,
      (iceCandidate: ICandidateMsg, room: string, clientId: string) => {
        logger.info(`received ice-candidate from client: ${clientId}`);
        socket.to(room).emit(socketMessages.iceCandidate, iceCandidate);
      }
    );

    socket.on(
      socketMessages.offer,
      (
        description: RTCSessionDescriptionInit,
        room: string,
        clientId: string
      ) => {
        logger.info(`received offer from client: ${clientId}`);
        socket.to(room).emit(socketMessages.offer, description);
      }
    );

    socket.on(
      socketMessages.answer,
      (
        description: RTCSessionDescriptionInit,
        room: string,
        clientId: string
      ) => {
        logger.info(`received answer from client: ${clientId}`);
        socket.to(room).emit(socketMessages.answer, description);
      }
    );

    socket.on(socketMessages.startCall, (room: string, clientId: string) => {
      logger.info(`${clientId} wants to start call`);
      socket.to(room).emit(socketMessages.startCall);
    });

    socket.on(socketMessages.hangUp, (room: string, clientId: string) => {
      logger.info(`${clientId} wants to hang up call`);
      socket.to(room).emit(socketMessages.hangUp);
    });

    socket.on(socketMessages.createOrJoinRoom, (room: string): void => {
      logger.info(`Received request to create or join room ${room}`);
      const beforeJoinNumClients =
        io.sockets.adapter.rooms.get(room)?.size || 0;
      if (beforeJoinNumClients === 2) {
        socket.to(socket.id).emit(socketMessages.full, socket.id, room);
        return;
      }

      socket.join(room);
      const afterJoinNumClients = io.sockets.adapter.rooms.get(room)?.size || 0;

      if (afterJoinNumClients === 1) {
        logger.info(`Client ID ${socket.id} created room ${room}`);
        socket.in(room).emit(socketMessages.created), socket.id, room;
      } else if (afterJoinNumClients === 2) {
        logger.info(`Client ID ${socket.id} joined room ${room}`);
        socket.in(room).emit(socketMessages.joined, socket.id, room);
      }

      logger.info(`Room ${room} now has ${afterJoinNumClients} client(s)`);
    });
  }
}

export const socketListeners: SocketListeners = new SocketListeners();
