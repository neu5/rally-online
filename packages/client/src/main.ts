import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Vector3,
} from "@babylonjs/core";
import { Socket, io } from "socket.io-client";

import { createScene } from "./scene/scene";
import { createList } from "./ui";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const FPSEl = document.getElementById("fps") as HTMLElement;
const playersListEl = document.getElementById("players-list") as HTMLElement;

const [...mobileControlsEls] = document.getElementsByClassName(
  "mobile-controls"
) as HTMLCollectionOf<HTMLElement>;
// const development = process.env.NODE_ENV === "development";
type WindowSize = {
  width: number;
  height: number;
};
let windowSize: WindowSize = { width: Infinity, height: Infinity };

const isTouchDevice = () => "ontouchstart" in window;

const updateWindowSize = () => {
  windowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const updateControls = () => {
  if (isTouchDevice()) {
    mobileControlsEls.forEach((el) => el.classList.remove("hide"));
  } else {
    mobileControlsEls.forEach((el) => el.classList.add("hide"));
  }
  if (isTouchDevice() && windowSize.width / windowSize.height < 1) {
    // show alert to turn device horizontally
  }
};

updateWindowSize();
updateControls();

let currentPlayerId: string | undefined = undefined;

const setCurrentPlayer = (id: string) => {
  [...playersListEl.children].find((el: HTMLElement) => {
    if (el.dataset.id === id) {
      el.classList.add("you");
      currentPlayerId = id;
      return true;
    }

    return false;
  });
};

(async () => {
  const engine: Engine = new Engine(canvas);
  const scene = await createScene(engine);

  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 3.5,
    130,
    Vector3.Zero()
  );

  camera.lowerBetaLimit = -Math.PI / 2.5;
  camera.upperBetaLimit = Math.PI / 2.5;
  camera.lowerRadiusLimit = 10;
  camera.upperRadiusLimit = 200;

  camera.attachControl(canvas, true);
  const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // share sockets interfaces?
  const socket: Socket<ServerToClientEvents> = io();

  socket.on(
    "playerConnected",
    (playersList: Array<{ data: { name: string } }>) => {
      createList(playersListEl, playersList);

      if (currentPlayerId !== undefined) {
        setCurrentPlayer(currentPlayerId);
      }
    }
  );

  socket.on("playerID", (id: string) => {
    if (playersListEl.childElementCount > 0) {
      setCurrentPlayer(id);
    } else {
      setTimeout(() => setCurrentPlayer(id), 1000);
    }
  });

  socket.on("playerLeft", (playersList: Array<{ data: { name: string } }>) => {
    createList(playersListEl, playersList);

    if (currentPlayerId !== undefined) {
      setCurrentPlayer(currentPlayerId);
    }
  });

  engine.runRenderLoop(() => {
    scene.render();

    FPSEl.textContent = `${engine.getFps().toFixed()} fps`;
  });

  window.addEventListener("resize", () => {
    engine.resize();

    updateWindowSize();
    updateControls();
  });
})();
