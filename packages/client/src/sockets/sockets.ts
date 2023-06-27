import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { Game, ServerToClientEvents, UsersList } from "@neu5/types/src";
import type { DialogWrapper } from "../ui/dialog";

const createSocketHandler = ({
  dialog,
  game,
}: {
  dialog: typeof DialogWrapper;
  game: Game;
}) => {
  const socket: Socket<ServerToClientEvents> = io(window.location.host, {
    autoConnect: false,
  });

  socket.onAny((event, ...args) => {
    console.log("onAny", event, args);
  });

  socket.on(
    "session",
    ({ sessionID, userID }: { sessionID: string; userID: string }) => {
      // attach the session ID to the next reconnection attempts
      socket.auth = { sessionID };
      // store it in the localStorage
      localStorage.setItem("rally-online", sessionID);
      // save the ID of the user
      socket.userID = userID;
    }
  );

  socket.on("users", (users: UsersList) => {
    game.ui.createPlayersList(users);
  });

  socket.on("server:close-dialog", () => {
    dialog.close();
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
