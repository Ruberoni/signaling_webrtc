/**
 * List of messages to use with Socket
 */
export const SOCKET_EVENT_TYPE = {
  MESSAGE: "message",
  CANDIDATE: "candidate",
  OFFER: "offer",
  ANSWER: "answer",
  SEND_CALL_OFFER: "call_offer",
  LEAVE: "leave",
  CREATED: "created",
  READY: "ready",
  ERROR: "error",
  CREATE_ROOM: "create-room",
  JOINED_ROOM: "joined-room",
  JOIN_ROOM: "join-room",
  ROOM_FULL: "room-full",
  ROOM_NOT_EXIST: "room-not-exist",
  ROOM_ALREADY_EXIST: "room-already-exist",
  LOGIN: "login",
  REMOTE_OFF: "remoteOff",
} as const;
