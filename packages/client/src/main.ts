import { io } from "socket.io-client";
import type { Quaternion } from "@babylonjs/core";
import { ArcRotateCamera, Engine, Scene, Vector3 } from "@babylonjs/core";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

import { createSocketHandler } from "./sockets/sockets";

import { startRace } from "./scene/scene";
import { UIDialogWrapper, UIcreatePlayersList, UIsetCurrentPlayer } from "./ui";
import { TOAST_COLORS } from "./utils";

import type {
  GameConfig,
  GameObject,
  Player,
  Position,
  ServerToClientEvents,
} from "@neu5/types/src";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const FPSEl = document.getElementById("fps") as HTMLElement;
const startRaceBtn = document.getElementById(
  "start-race-btn"
) as HTMLAnchorElement;
const stopRaceBtn = document.getElementById(
  "stop-race-btn"
) as HTMLAnchorElement;
const playersListEl = document.getElementById("players-list") as HTMLElement;

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

(async () => {
  const engine = new Engine(canvas, true);
  let scene: Scene = new Scene(engine);

  createSocketHandler();
})();
