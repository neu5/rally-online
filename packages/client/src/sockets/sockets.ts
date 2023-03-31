import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { Game, PlayersList, ServerToClientEvents } from "@neu5/types/src";

const createSocketHandler = ({ game }: { game: Game }) => {
  const socket: Socket<ServerToClientEvents> = io(window.location.host, {
    autoConnect: false,
  });

  socket.onAny((event, ...args) => {
    console.log("onAny", event, args);
  });

  socket.on("connect_error", (err) => {
    if (err.message === "invalid username") {
      game.usernameAlreadySelected = false;
    }
  });

  return { socket };

  // socket.on("server:game-info", ({ socketId }) => {
  //   game.thisPlayerSocketId = socketId;

  //   socket.emit("player:get-users-list");
  // });

  // socket.on("server:users-list-update", (playersList: PlayersList) => {
  //   game.ui.createPlayersList(playersList);

  //   if (game.thisPlayerSocketId) {
  //     game.ui.setCurrentPlayer(game.thisPlayerSocketId);
  //   }
  // });
};

export { createSocketHandler };