import { io } from "socket.io-client";
import { ArcRotateCamera, Engine, Scene, Vector3 } from "@babylonjs/core";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

import { startRace } from "./scene/scene";
import { UIDialogWrapper, UIcreatePlayersList, UIsetCurrentPlayer } from "./ui";
import { TOAST_COLORS } from "./utils";

import type { Socket } from "socket.io-client";
import type {
  ActionTypes,
  GameConfig,
  GameInfo,
  GameObject,
  PlayerFromServer,
  PlayersFromServer,
  PlayersMap,
  Position,
  Race,
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

let dataFromServer: PlayersFromServer = [];

type GameType = {
  playersMap: PlayersMap;
  rootEl: HTMLElement | null;
};

const game: GameType = {
  playersMap: new Map(),
  rootEl: document.getElementById("root"),
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

const toggleRaceBtns = (isRaceStarted: boolean) => {
  if (isRaceStarted) {
    startRaceBtn.setAttribute("disabled", "disabled");
    stopRaceBtn.removeAttribute("disabled");
  } else {
    startRaceBtn.removeAttribute("disabled");
    stopRaceBtn.setAttribute("disabled", "disabled");
  }
};

const dialog = new UIDialogWrapper({ rootEl: game.rootEl });

const pEl = document.createElement("p");
pEl.textContent =
  "The game may be more playable if you rotate the screen horizontally";

const updateControls = () => {
  if (isTouchDevice()) {
    mobileControlsEls.forEach((el) => el.classList.remove("hide"));
  } else {
    mobileControlsEls.forEach((el) => el.classList.add("hide"));
  }

  if (isTouchDevice() && windowSize.width / windowSize.height < 1) {
    dialog.show({
      content: pEl,
    });
  }
};

updateWindowSize();
updateControls();

let currentPlayerId: string | undefined = undefined;

(async () => {
  const engine = new Engine(canvas, true);
  let scene: Scene = new Scene(engine);

  const socket: Socket<ServerToClientEvents> = io();

  const startEngineLoop = () => {
    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 4,
      130,
      new Vector3(0, 0, 0)
    );
    camera.attachControl(canvas, true);

    camera.lowerBetaLimit = -Math.PI / 2.5;
    camera.upperBetaLimit = Math.PI / 2.5;
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 200;

    camera.maxZ = 500;

    camera.attachControl(canvas, true);

    engine.runRenderLoop(() => {
      scene.render();

      if (dataFromServer === null || !dataFromServer.length) {
        return;
      }

      dataFromServer.forEach((playerFromServer: PlayerFromServer) => {
        const player = game.playersMap.get(playerFromServer.id);

        if (!player || !playerFromServer.vehicle) {
          return;
        }

        const {
          vehicle: {
            body: { position, quaternion },
            wheels,
          },
        } = playerFromServer;

        player.vehicle?.body.position.set(position.x, position.y, position.z);
        player.vehicle?.body.rotationQuaternion.set(
          quaternion.x,
          quaternion.y,
          quaternion.z,
          quaternion.w
        );

        wheels.forEach((wheel: { position: Position }, idx: number) => {
          player.vehicle?.wheels[idx].position.set(
            wheel.position.x,
            wheel.position.y,
            wheel.position.z
          );
          player.vehicle?.wheels[idx].rotationQuaternion.set(
            quaternion.x,
            quaternion.y,
            quaternion.z,
            quaternion.w
          );
        });
      });

      FPSEl.textContent = `${engine.getFps().toFixed()} fps`;
    });
  };

  const sendAction = (playerActions: ActionTypes[]) => {
    if (currentPlayerId) {
      socket.emit("player:action", {
        id: currentPlayerId,
        playerActions,
      });
    }
  };

  socket.on(
    "server:users-list-update",
    // @ts-ignore
    (
      playersList: Array<{
        color: string;
        displayName: string;
        socketId: string;
        vehicle: any;
      }>
    ) => {
      game.playersMap.clear();

      playersList.forEach(
        ({
          color,
          displayName,
          socketId,
          vehicle,
        }: {
          color: string;
          displayName: string;
          socketId: string;
          vehicle: any;
        }) => {
          game.playersMap.set(socketId, {
            ...(color ? { color } : undefined),
            displayName,
            socketId,
            vehicle,
            isCurrentPlayer: socketId === currentPlayerId,
            vehicleSteering: 0,
            actions: {
              accelerate: false,
              brake: false,
              left: false,
              right: false,
            },
          });
        }
      );

      UIcreatePlayersList(playersListEl, game.playersMap);

      if (currentPlayerId) {
        UIsetCurrentPlayer(playersListEl, currentPlayerId);
      }
    }
  );

  socket.on("server:game-info", ({ id, race }: GameInfo) => {
    currentPlayerId = id;

    toggleRaceBtns(race.isStarted);

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

    socket.emit("player:get-users-list");
  });

  if (game.rootEl) {
    game.rootEl.addEventListener("setName", (ev) => {
      const customEvent = ev as CustomEvent<string>;

      if (customEvent.detail !== undefined && currentPlayerId) {
        socket.emit("player:set-name", {
          id: currentPlayerId,
          displayName: customEvent.detail,
        });
      }
    });
  }

  socket.on(
    "server:start-race",
    async ({
      config,
      objects,
      race,
    }: {
      config: GameConfig;
      objects: GameObject[];
      race: Race;
    }) => {
      scene.dispose();
      engine.stopRenderLoop();

      toggleRaceBtns(race.isStarted);

      const newScene = await startRace({
        engine,
        gameConfig: config,
        gameObjects: objects,
        playersMap: game.playersMap,
        sendAction,
      });

      scene = newScene.scene;
      game.playersMap = newScene.playersMap;

      startEngineLoop();
    }
  );

  socket.on("server:stop-race", (race: Race) => {
    toggleRaceBtns(race.isStarted);

    scene.dispose();
    engine.stopRenderLoop();
  });

  socket.on("server:action", (playersFromServer: PlayersFromServer) => {
    dataFromServer = playersFromServer;
  });

  socket.on("server:show-error", ({ message }: { message: string }) => {
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

  socket.on("server:close-dialog", () => {
    dialog.close();
  });

  startRaceBtn.addEventListener("click", async () => {
    socket.emit("player:start-race");
  });

  stopRaceBtn.addEventListener("click", async () => {
    socket.emit("player:stop-race");
  });

  window.addEventListener("resize", () => {
    engine.resize();

    updateWindowSize();
    updateControls();
  });
})();
