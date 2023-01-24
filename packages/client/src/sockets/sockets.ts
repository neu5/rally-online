import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents } from "@neu5/types/src";

const createSocketHandler = () => {
  const socket: Socket<ServerToClientEvents> = io();

  socket.on("server:game-info", ({ socketId }) => {
    console.log(socketId);

    // currentPlayerId = id;

    // toggleRaceBtns(race.isStarted);

    // const labelName = document.createElement("label");
    // labelName.textContent = "Your display name (2-16 characters) ";
    // const inputName = document.createElement("input");
    // inputName.type = "text";
    // labelName.appendChild(inputName);

    // const inputSubmit = document.createElement("input");
    // inputSubmit.type = "submit";
    // labelName.appendChild(inputSubmit);

    // dialog.show({
    //   content: labelName,
    //   inputToLook: inputName,
    //   closeButtonVisibility: false,
    // });

    // socket.emit("player:get-users-list");
  });
};

export { createSocketHandler };
