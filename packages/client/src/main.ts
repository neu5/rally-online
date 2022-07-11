import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { Socket, io } from "socket.io-client";

import { startRace } from "./scene/scene";
import { UIcreatePlayersList, UIsetCurrentPlayer } from "./ui";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const FPSEl = document.getElementById("fps") as HTMLElement;
const startBtn = document.getElementById("start-btn") as HTMLAnchorElement;
const playersListEl = document.getElementById("players-list") as HTMLElement;

export type PlayersList = Map<
  string,
  { name: string; vehicle: Object; isCurrentPlayer: boolean }
>;

type GameType = {
  playersMap: PlayersList;
};
const game: GameType = {
  playersMap: new Map(),
};

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

  const sendAction = (action: string) => {
    socket.emit("player:action", {
      id: currentPlayerId,
      action,
    });
  };

  socket.on(
    "playerListUpdate",
    (playersList: Array<{ name: string; vehicle: Object }>) => {
      game.playersMap.clear();

      console.log(playersList);

      playersList.forEach(
        ({ name, vehicle }: { name: string; vehicle: Object }) =>
          game.playersMap.set(name, {
            name,
            vehicle,
            isCurrentPlayer: name === currentPlayerId,
          })
      );

      UIcreatePlayersList(playersListEl, game.playersMap);

      if (currentPlayerId) {
        UIsetCurrentPlayer(playersListEl, currentPlayerId);
      }
    }
  );

  socket.on("playerID", (id: string) => {
    currentPlayerId = id;
    socket.emit("getPlayerList");
  });

  socket.on("server:start-race", async () => {
    const newScene = await startRace({
      engine,
      oldScene: scene,
      playersMap: game.playersMap,
      sendAction,
      socket,
    });

    scene = newScene;
    startEngineLoop();
  });

  startBtn.addEventListener("click", async () => {
    socket.emit("player:start-race", {
      id: 0,
    });
  });

  window.addEventListener("resize", () => {
    engine.resize();

    updateWindowSize();
    updateControls();
  });
})();
