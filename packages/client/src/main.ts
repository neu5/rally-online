// import type { Quaternion } from "@babylonjs/core";
import { ArcRotateCamera, Engine, Scene, Vector3 } from "@babylonjs/core";
// import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import type { Game } from "@neu5/types/src";
import { FEATURES_NAMES, features } from "@neu5/types/src";

import { createSocketHandler } from "./sockets/sockets";
import { ui } from "./ui";
import { loginDialog } from "./ui/dialog-login";
import { startRace } from "./scene/scene";
// import { UIDialogWrapper, UIcreatePlayersList, UIsetCurrentPlayer } from "./ui";
// import { TOAST_COLORS } from "./utils";

// import type {
//   GameConfig,
//   GameObject,
//   Player,
//   Position,
//   ServerToClientEvents,
// } from "@neu5/types/src";

const joinRaceRoomBtn = document.getElementById(
  "join-race-room-btn"
) as HTMLAnchorElement;
const leaveRaceRoomBtn = document.getElementById(
  "leave-race-room-btn"
) as HTMLAnchorElement;

let dataFromServer: PlayersFromServer = [];

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const FPSEl = document.getElementById("fps") as HTMLElement;
const startRaceBtn = document.getElementById(
  "start-race-btn"
) as HTMLAnchorElement;
const stopRaceBtn = document.getElementById(
  "stop-race-btn"
) as HTMLAnchorElement;
// const playersListEl = document.getElementById("players-list") as HTMLElement;

const game: Game = {
  elements: {
    joinRaceRoomBtn,
    leaveRaceRoomBtn,
    startRaceBtn,
  },
  isDevelopment: process.env.NODE_ENV === "development",
  rootEl: document.getElementById("root"),
  ui,
  usernameAlreadySelected: false,
};

const sessionID = localStorage.getItem("rally-online");

const dialog = new ui.DialogWrapper({ rootEl: game.rootEl });

const startEngineLoop = ({ engine, scene, playersMap, roomUsers }) => {
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
      const player = playersMap.find((player) => player.userID === playerFromServer.userID);

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

(async () => {
  const engine = new Engine(canvas, true);
  let scene: Scene = new Scene(engine);

  const { socket } = createSocketHandler({ dialog, engine, game, scene });

  if (game.rootEl) {
    game.rootEl.addEventListener("setName", (ev) => {
      const customEvent = ev as CustomEvent<string>;

      if (customEvent.detail !== undefined) {
        // const username = customEvent.detail;
        // game.usernameAlreadySelected = true;
        socket.emit("client:set name", {
          username: customEvent.detail,
        });
      }
    });
  }

  joinRaceRoomBtn.addEventListener("click", async () => {
    socket.emit("client:join race room");
  });
  leaveRaceRoomBtn.addEventListener("click", async () => {
    socket.emit("client:leave race room");
  });
  startRaceBtn.addEventListener("click", async () => {
    socket.emit("client:start the race");
  });

  if (game.isDevelopment) {
    stopRaceBtn.classList.remove("hide");

    stopRaceBtn.addEventListener("click", async () => {
      socket.emit("client-dev:stop the race");

      scene.dispose();
      engine.stopRenderLoop();
    });
  }

  if (features[FEATURES_NAMES.PERSISTENS_SESSION] && sessionID) {
    game.usernameAlreadySelected = true;
    socket.auth = { sessionID };
  }

  const { labelName, inputName } = loginDialog();

  dialog.show({
    content: labelName,
    inputToLook: inputName,
    closeButtonVisibility: false,
  });

  socket.connect();

  socket.on("server:action", (playersFromServer: PlayersFromServer) => {
    dataFromServer = playersFromServer;
  });

  const sendAction = (playerActions: string[]) => {
    socket.emit("client:action", {
      id: game.playersMap.find((player) => player.isCurrentPlayer).userID,
      playerActions,
    });
  };

  socket.on(
    "server:start-race",
    async ({
      playersList,
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

      // toggleRaceBtns(race.isStarted);

      const newScene = await startRace({
        engine,
        gameConfig: config,
        gameObjects: objects,
        playersMap: playersList.map((player) => ({
          ...player,
          isCurrentPlayer: player.userID === socket.userID,
        })),
        sendAction,
      });

      scene = newScene.scene;
      game.playersMap = newScene.playersMap;

      startEngineLoop({
        engine,
        scene,
        playersMap: game.playersMap,
        roomUsers: game.roomUsers,
      });
    }
  );

  window.addEventListener("resize", () => {
    engine.resize();
  
    // updateWindowSize();
    // updateControls();
  });
})();
