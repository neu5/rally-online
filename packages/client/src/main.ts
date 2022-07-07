import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { Socket, io } from "socket.io-client";

import { startRace } from "./scene/scene";
import { createList } from "./ui";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const FPSEl = document.getElementById("fps") as HTMLElement;
const startBtn = document.getElementById("start-btn") as HTMLAnchorElement;
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

  let scene: Scene = new Scene(engine);

  // share sockets interfaces?
  const socket: Socket<ServerToClientEvents> = io();

  const startEngineLoop = () => {
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

    engine.runRenderLoop(() => {
      scene.render();

      FPSEl.textContent = `${engine.getFps().toFixed()} fps`;
    });
  };

  socket.on(
    "playerListUpdate",
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

  const sendAction = (action: string) => {
    socket.emit("player:action", {
      id: 0,
      action,
    });
  };

  startBtn.addEventListener("click", async () => {
    const newScene = await startRace({
      engine,
      oldScene: scene,
      sendAction,
      socket,
    });

    scene = newScene;

    startEngineLoop();
  });

  window.addEventListener("resize", () => {
    engine.resize();

    updateWindowSize();
    updateControls();
  });
})();
