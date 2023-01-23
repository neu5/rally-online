import type { Socket } from "socket.io";
import type { ServerToClientEvents, UsersMap } from "@neu5/types/src";

const createSocketHandlers = ({
  //   gameInfo,
  socket,
  usersMap,
}: {
  //   gameInfo: GameInfo;
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

  socket.on("disconnect", () => {
    usersMap.delete(socket.id);

    // const playerToDelete = playersMap.get(socket.id);
    // const playerNumber = playerNumbers.find(
    //   (pNumber) => pNumber.idx === playerToDelete?.playerNumber
    // );

    // if (playerNumber) {
    //   playerNumber.isFree = true;
    // }

    // playersMap.delete(socket.id);

    // io.emit("server:users-list-update", playersMapToArray(playersMap));
  });
};

export { createSocketHandlers };
