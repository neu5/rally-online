import type { Server, Socket } from "socket.io";
import type {
  PlayersList,
  ServerToClientEvents,
  UsersMap,
} from "@neu5/types/src";

const usersMapToArray = (usersMap: UsersMap): PlayersList =>
  Array.from(usersMap).map(([id, { socketId }]) => ({
    id,
    socketId,
  }));

const createSocketHandlers = ({
  io,
  socket,
  usersMap,
}: {
  io: Server<ServerToClientEvents>;
  socket: Socket<ServerToClientEvents>;
  usersMap: UsersMap;
}) => {
  usersMap.set(socket.id, {
    socketId: socket.id,
  });

  socket.emit("server:game-info", {
    socketId: socket.id,
    // race,
  });

  socket.on("player:get-users-list", () => {
    socket.emit("server:users-list-update", usersMapToArray(usersMap));
  });

  socket.on("disconnect", () => {
    usersMap.delete(socket.id);

    io.emit("server:users-list-update", usersMapToArray(usersMap));
  });
};

export { createSocketHandlers };
