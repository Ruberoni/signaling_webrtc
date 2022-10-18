import { Server, Socket } from "socket.io";
import { SOCKET_EVENT_TYPE } from "./constants/socketMessages";
import { logger, logProcedure } from "./logger";

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
    const emitMessage = (metadata: any = "") => {
      socket.broadcast.emit(SOCKET_EVENT_TYPE.MESSAGE, metadata);
    };

    logger.info("a user connected");
    logger.info(
      `Actual amount of connected sockets: ${JSON.stringify(
        io.engine.clientsCount
      )}`
    );

    socket.on("disconnect", () => {
      logger.info("user disconnected");
    });

    socket.on(SOCKET_EVENT_TYPE.MESSAGE, (event: any): void => {
      // logger.info(`Client said: ${JSON.stringify(event)}`);

      if (typeof event !== "object") {
        console.warn("[socket.on][message] El mensaje no es un object");
        socket.broadcast.emit(SOCKET_EVENT_TYPE.MESSAGE, event);
        return;
      }

      const roomCode: undefined | string = event.roomCode;
      const room = io.sockets.adapter.rooms.get(roomCode);
      if (roomCode && !room) {
        logger.warn(`Room doesnt exist. roomCode: ${roomCode}`);
      }

      switch (event.type) {
        /**
         * event.userId
         */
        case SOCKET_EVENT_TYPE.LOGIN:
          logProcedure(SOCKET_EVENT_TYPE.LOGIN, {
            userId: event.userId,
            roomCode,
          });
          socket.join(roomCode);
          socket.broadcast.to(roomCode).emit(SOCKET_EVENT_TYPE.MESSAGE, {
            type: SOCKET_EVENT_TYPE.LOGIN,
            userId: event.userId,
          });
          break;
        /**
         * event.offer
         */
        case SOCKET_EVENT_TYPE.OFFER:
          logProcedure(SOCKET_EVENT_TYPE.OFFER);
          socket.broadcast.to(roomCode).emit(SOCKET_EVENT_TYPE.MESSAGE, {
            type: SOCKET_EVENT_TYPE.OFFER,
            offer: event.offer, // Remote description
          });
          break;
        /**
         * event.answer
         */
        case SOCKET_EVENT_TYPE.ANSWER:
          logProcedure(SOCKET_EVENT_TYPE.ANSWER);
          socket.broadcast.to(roomCode).emit(SOCKET_EVENT_TYPE.MESSAGE, {
            type: SOCKET_EVENT_TYPE.ANSWER,
            answer: event.answer,
          });
          break;

        /**
         *  event.candidate,
         */
        case SOCKET_EVENT_TYPE.CANDIDATE:
          logProcedure(SOCKET_EVENT_TYPE.CANDIDATE);
          socket.broadcast.to(roomCode).emit(SOCKET_EVENT_TYPE.MESSAGE, {
            type: SOCKET_EVENT_TYPE.CANDIDATE,
            candidate: event.candidate,
          });
          break;

        case SOCKET_EVENT_TYPE.LEAVE:
          logProcedure(SOCKET_EVENT_TYPE.LEAVE);
          socket.broadcast.to(roomCode).emit(SOCKET_EVENT_TYPE.MESSAGE, {
            type: SOCKET_EVENT_TYPE.LEAVE,
          });
          socket.disconnect();
          break;

        /**
         *  event.remoteOff,
         */
        case SOCKET_EVENT_TYPE.REMOTE_OFF: {
          logProcedure(SOCKET_EVENT_TYPE.REMOTE_OFF);
          socket.broadcast.to(roomCode).emit(SOCKET_EVENT_TYPE.MESSAGE, {
            type: SOCKET_EVENT_TYPE.REMOTE_OFF,
            remoteOff: event.remoteOff,
          });
          break;
        }

        case SOCKET_EVENT_TYPE.JOIN_ROOM:
          logProcedure(SOCKET_EVENT_TYPE.JOIN_ROOM, { roomCode });
          if (!room) {
            logger.info("Room doesnt exits");
            socket.to(socket.id).emit(SOCKET_EVENT_TYPE.MESSAGE, {
              type: SOCKET_EVENT_TYPE.ROOM_NOT_EXIST,
              roomCode,
            });
            return;
          }

          if (room.size === 2) {
            logger.info("Room full");
            socket.to(socket.id).emit(SOCKET_EVENT_TYPE.MESSAGE, {
              type: SOCKET_EVENT_TYPE.ROOM_FULL,
              roomCode,
            });
            return;
          }

          socket.join(roomCode);
          socket.broadcast.emit(SOCKET_EVENT_TYPE.MESSAGE, {
            type: SOCKET_EVENT_TYPE.CREATED,
            roomCode,
          });
          break;
        case SOCKET_EVENT_TYPE.SEND_CALL_OFFER:
          logProcedure(SOCKET_EVENT_TYPE.SEND_CALL_OFFER);
          emitMessage();
          break;
        case SOCKET_EVENT_TYPE.CREATE_ROOM:
          logProcedure(SOCKET_EVENT_TYPE.JOIN_ROOM, { roomCode });
          if (room) {
            logger.info("Room already exist");
            socket.to(socket.id).emit(SOCKET_EVENT_TYPE.MESSAGE, {
              type: SOCKET_EVENT_TYPE.ROOM_ALREADY_EXIST,
              roomCode,
            });
            return;
          }
          socket.join(roomCode);
          socket.broadcast.emit(SOCKET_EVENT_TYPE.MESSAGE, {
            type: SOCKET_EVENT_TYPE.CREATE_ROOM,
            room: roomCode,
          });
          break;
        case SOCKET_EVENT_TYPE.PING:
          logProcedure(event.type, { roomCode });
          if (roomCode) {
            socket.broadcast.to(roomCode).emit(SOCKET_EVENT_TYPE.MESSAGE, {
              type: "pong",
              roomCode,
            });
          } else {
            socket.broadcast.emit(SOCKET_EVENT_TYPE.MESSAGE, {
              type: "pong",
            });
          }
        default:
          socket.broadcast.emit(SOCKET_EVENT_TYPE.ERROR, {
            message: "Message type unknown",
          });
      }
      // for a real app, would be room-only (not broadcast)
      // socket.broadcast.emit(SOCKET_EVENT_TYPE.MESSAGE, message);
    });

    socket.on(
      SOCKET_EVENT_TYPE.CANDIDATE,
      (iceCandidate: ICandidateMsg, room: string, clientId: string) => {
        logger.info(`received ice-candidate from client: ${clientId}`);
        socket.to(room).emit(SOCKET_EVENT_TYPE.CANDIDATE, iceCandidate);
      }
    );

    socket.on(
      SOCKET_EVENT_TYPE.OFFER,
      (
        description: RTCSessionDescriptionInit,
        room: string,
        clientId: string
      ) => {
        logger.info(`received offer from client: ${clientId}`);
        socket.to(room).emit(SOCKET_EVENT_TYPE.OFFER, description);
      }
    );

    socket.on(
      SOCKET_EVENT_TYPE.ANSWER,
      (
        description: RTCSessionDescriptionInit,
        room: string,
        clientId: string
      ) => {
        logger.info(`received answer from client: ${clientId}`);
        socket.to(room).emit(SOCKET_EVENT_TYPE.ANSWER, description);
      }
    );

    socket.on(
      SOCKET_EVENT_TYPE.SEND_CALL_OFFER,
      (room: string, clientId: string) => {
        logger.info(`${clientId} wants to start call`);
        socket.to(room).emit(SOCKET_EVENT_TYPE.SEND_CALL_OFFER);
      }
    );

    socket.on(SOCKET_EVENT_TYPE.LEAVE, (room: string, clientId: string) => {
      logger.info(`${clientId} wants to hang up call`);
      socket.to(room).emit(SOCKET_EVENT_TYPE.LEAVE);
    });

    socket.on(SOCKET_EVENT_TYPE.CREATE_ROOM, (room: string): void => {
      logger.info(`Received request to create or join room ${room}`);
      const beforeJoinNumClients =
        io.sockets.adapter.rooms.get(room)?.size || 0;
      if (beforeJoinNumClients === 2) {
        socket.to(socket.id).emit(SOCKET_EVENT_TYPE.ROOM_FULL, socket.id, room);
        return;
      }

      socket.join(room);
      const afterJoinNumClients = io.sockets.adapter.rooms.get(room)?.size || 0;

      if (afterJoinNumClients === 1) {
        logger.info(`Client ID ${socket.id} created room ${room}`);
        socket.in(room).emit(SOCKET_EVENT_TYPE.CREATED), socket.id, room;
      } else if (afterJoinNumClients === 2) {
        logger.info(`Client ID ${socket.id} joined room ${room}`);
        socket.in(room).emit(SOCKET_EVENT_TYPE.JOINED_ROOM, socket.id, room);
      }

      logger.info(`Room ${room} now has ${afterJoinNumClients} client(s)`);
    });
  }
}

export const socketListeners: SocketListeners = new SocketListeners();
