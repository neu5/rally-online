// import type { Quaternion } from "@babylonjs/core";
// import { ArcRotateCamera, Engine, Scene, Vector3 } from "@babylonjs/core";
// import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import type { Game } from "@neu5/types/src";
import { FEATURES_NAMES, features } from "@neu5/types/src";

import { createSocketHandler } from "./sockets/sockets";
import { ui } from "./ui";
// import { startRace } from "./scene/scene";
// import { UIDialogWrapper, UIcreatePlayersList, UIsetCurrentPlayer } from "./ui";
// import { TOAST_COLORS } from "./utils";

// import type {
//   GameConfig,
//   GameObject,
//   Player,
//   Position,
//   ServerToClientEvents,
// } from "@neu5/types/src";

// const canvas = document.getElementById("canvas") as HTMLCanvasElement;
// const FPSEl = document.getElementById("fps") as HTMLElement;
// const startRaceBtn = document.getElementById(
//   "start-race-btn"
// ) as HTMLAnchorElement;
// const stopRaceBtn = document.getElementById(
//   "stop-race-btn"
// ) as HTMLAnchorElement;
// const playersListEl = document.getElementById("players-list") as HTMLElement;

// const throttle = (func: Function, timeFrame: number = 0) => {
//   var lastTime = 0;
//   return function (...args: any) {
//     var now = Date.now();
//     if (now - lastTime >= timeFrame) {
//       func(...args);
//       lastTime = now;
//     }
//   };
// };

// const log = throttle((...args: Array<any>) => {
//   console.log(...args);
// }, 1000);

const game: Game = {
  thisPlayerSocketId: null,
  usernameAlreadySelected: false,
  rootEl: document.getElementById("root"),
  ui,
  // usersMap: new Map(),
};

const sessionID = localStorage.getItem("sessionID");

const dialog = new ui.DialogWrapper({ rootEl: game.rootEl });

(async () => {
  // const engine = new Engine(canvas, true);
  // let scene: Scene = new Scene(engine);

  const { socket } = createSocketHandler({ game });

  if (game.rootEl) {
    game.rootEl.addEventListener("setName", (ev) => {
      const customEvent = ev as CustomEvent<string>;

      if (customEvent.detail !== undefined) {
        const username = customEvent.detail;
        game.usernameAlreadySelected = true;
        socket.auth = { username };
        socket.connect();
      }

      // if (customEvent.detail !== undefined && currentPlayerId) {
      //   socket.emit("player:set-name", {
      //     id: currentPlayerId,
      //     displayName: customEvent.detail,
      //   });
      // }
    });
  }

  if (features[FEATURES_NAMES.PERSISTENS_SESSION] && sessionID) {
    game.usernameAlreadySelected = true;
    socket.auth = { sessionID };
    socket.connect();
  } else {
    const labelName = document.createElement("label");
    labelName.textContent = "Your display name (2-16 characters) ";
    const inputName = document.createElement("input");
    inputName.type = "text";
    labelName.appendChild(inputName);

    const inputSubmit = document.createElement("input");
    inputSubmit.type = "submit";
    labelName.appendChild(inputSubmit);

    dialog.show({
      content: labelName,
      inputToLook: inputName,
      closeButtonVisibility: false,
    });
  }
})();
