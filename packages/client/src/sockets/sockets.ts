import { io } from "socket.io-client";
import Toastify from "toastify-js";
import { TOAST_COLORS } from "../utils";

import type { Socket } from "socket.io-client";
import type { Game, RoomList, UsersList } from "@neu5/types/src";
import type { DialogWrapper } from "../ui/dialog";

type ExtendedSocket = Socket & {
  userID?: string;
};

const toggleStartRaceBtns = (
  startRaceBtn: HTMLElement,
  canStartTheRace: boolean
) => {
  if (canStartTheRace) {
    startRaceBtn.removeAttribute("disabled");
  } else {
    startRaceBtn.setAttribute("disabled", "disabled");
  }
};

const createSocketHandler = ({
  dialog,
  game,
}: {
  dialog: DialogWrapper;
  game: Game;
}) => {
  const socket: ExtendedSocket = io(window.location.host, {
    autoConnect: false,
  });

  if (game.isDevelopment) {
    socket.onAny((event, ...args) => {
      console.log("onAny", event, args);
    });
  }

  socket.on(
    "server:session",
    ({ sessionID, userID }: { sessionID: string; userID: string }) => {
      // attach the session ID to the next reconnection attempts
      socket.auth = { sessionID };
      // store it in the localStorage
      localStorage.setItem("rally-online", sessionID);
      // save the ID of the user
      socket.userID = userID;
    }
  );

  socket.on("server:send users", (users: UsersList) => {
    game.ui.createPlayersList(users);

    if (socket.userID) {
      game.ui.setCurrentPlayer(socket.userID);
    }
  });

  socket.on("server:send room users", (roomUsers: RoomList) => {
    game.ui.createRoomList(roomUsers);
    game.roomUsers = roomUsers;
  });

  socket.on("server:user can join the room", () => {
    game.ui.showElement(game.elements.joinRaceRoomBtn);
    game.ui.hideElement(game.elements.leaveRaceRoomBtn);
  });

  socket.on("server:user can leave the room", () => {
    game.ui.hideElement(game.elements.joinRaceRoomBtn);
    game.ui.showElement(game.elements.leaveRaceRoomBtn);
  });

  socket.on("server:user can start the race", () => {
    toggleStartRaceBtns(game.elements.startRaceBtn, true);
  });

  socket.on("server:user cannot start the race", () => {
    toggleStartRaceBtns(game.elements.startRaceBtn, false);
  });

  socket.on("server:close dialog", () => {
    dialog.close();
  });

  socket.on("server:show error", ({ message }: { message: string }) => {
    Toastify({
      text: message,
      duration: -1,
      close: true,
      gravity: "top",
      position: "center",
      style: {
        background: TOAST_COLORS.RED,
      },
    }).showToast();
  });

  socket.on("connect_error", (err) => {
    if (err.message === "invalid username") {
      game.usernameAlreadySelected = false;
    }
  });

  return { socket };
};

export { createSocketHandler };
