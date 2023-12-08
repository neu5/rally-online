import { ArcRotateCamera, Engine, Scene, Vector3 } from "@babylonjs/core";
import "toastify-js/src/toastify.css";
import { FEATURES_NAMES, features } from "@neu5/types/src";

import { createSocketHandler } from "./sockets/sockets";
import { ui } from "./ui";
import { loginDialog } from "./ui/dialog-login";
import { startRace } from "./scene/scene";
// import { UIDialogWrapper, UIcreatePlayersList, UIsetCurrentPlayer } from "./ui";
import { debounce, toggleStartRaceBtns } from "./utils";
import type {
  GameClient,
  GameConfig,
  GameObject,
  PlayerFromServer,
  PlayersFromServer,
  // Position,
} from "@neu5/types/src";
import type { Quaternion } from "@babylonjs/core";

export type Player = PlayerFromServer & {
  isCurrentPlayer: boolean;
  vehicle: {
    body: {
      position: Vector3;
      rotationQuaternion: Quaternion;
      quaternion: Quaternion;
    };
    wheels: Array<{
      position: Vector3;
      rotationQuaternion: Quaternion;
      quaternion: Quaternion;
    }>;
  };
};

export type PlayersMap = Array<Player>;

const joinRaceRoomBtn = document.getElementById(
  "join-race-room-btn"
) as HTMLAnchorElement;
const leaveRaceRoomBtn = document.getElementById(
  "leave-race-room-btn"
) as HTMLAnchorElement;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const FPSEl = document.getElementById("fps") as HTMLElement;
const startRaceBtn = document.getElementById(
  "start-race-btn"
) as HTMLAnchorElement;
const stopRaceBtn = document.getElementById(
  "stop-race-btn"
) as HTMLAnchorElement;
const [...mobileControlsEls] = document.getElementsByClassName(
  "mobile-controls"
) as HTMLCollectionOf<HTMLElement>;
// const playersListEl = document.getElementById("players-list") as HTMLElement;

let dataFromServer: PlayersFromServer = [];

const game: GameClient = {
  elements: {
    joinRaceRoomBtn,
    leaveRaceRoomBtn,
    startRaceBtn,
  },
  isDevelopment: process.env.NODE_ENV === "development",
  playersMap: [],
  roomUsers: [],
  rootEl: document.getElementById("root"),
  ui,
  usernameAlreadySelected: false,
  windowSize: {
    width: Infinity,
    height: Infinity,
  },
};

const sessionID = localStorage.getItem("rally-online");

const dialog = new ui.DialogWrapper({ rootEl: game.rootEl });

ui.MobileControls.updateWindowSize(game);
ui.MobileControls.updateControls({ dialog, game, mobileControlsEls });

const startEngineLoop = ({
  engine,
  playersMap,
  scene,
}: {
  engine: Engine;
  playersMap: PlayersMap;
  scene: Scene;
}) => {
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
      const player = playersMap.find(
        (currentPlayer) => currentPlayer.userID === playerFromServer.userID
      );

      if (!player || !playerFromServer.sphere) {
        return;
      }

      // const {
      //   sphere: { position },
      // } = playerFromServer;

      // player.vehicle.position.set(position._x, position._y, position._z);

      // const {
      //   vehicle: {
      //     body: { position, quaternion },
      //     wheels,
      //   },
      // } = playerFromServer;

      // player.vehicle?.body.position.set(position.x, position.y, position.z);
      // player.vehicle?.body.rotationQuaternion.set(
      //   quaternion.x,
      //   quaternion.y,
      //   quaternion.z,
      //   quaternion.w
      // );

      // wheels.forEach((wheel: { position: Position }, idx: number) => {
      //   player.vehicle?.wheels[idx].position.set(
      //     wheel.position.x,
      //     wheel.position.y,
      //     wheel.position.z
      //   );
      //   player.vehicle?.wheels[idx].rotationQuaternion.set(
      //     quaternion.x,
      //     quaternion.y,
      //     quaternion.z,
      //     quaternion.w
      //   );
      // });
    });

    FPSEl.textContent = `${engine.getFps().toFixed()} fps`;
  });
};

(async () => {
  const engine = new Engine(canvas, true);
  let scene: Scene = new Scene(engine);

  const { socket } = createSocketHandler({ dialog, game });

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
    const player = game.playersMap.find(
      (currentPlayer) => currentPlayer.isCurrentPlayer
    );
    const id = player?.userID;

    if (id) {
      socket.emit("client:action", {
        id,
        playerActions,
      });
    }
  };

  socket.on(
    "server:start-race",
    async ({
      config,
      isRaceStarted,
      objects,
      playersList,
    }: {
      config: GameConfig;
      isRaceStarted: boolean;
      objects: GameObject[];
      playersList: PlayersMap;
    }) => {
      scene.dispose();
      engine.stopRenderLoop();

      if (isRaceStarted) {
        game.ui.hideElement(game.elements.joinRaceRoomBtn);
        game.ui.hideElement(game.elements.leaveRaceRoomBtn);
      }

      toggleStartRaceBtns(game.elements.startRaceBtn, !isRaceStarted);

      const newScene = await startRace({
        engine,
        gameConfig: config,
        gameObjects: objects,
        playersMap: playersList.map((player: Player) => ({
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
      });
    }
  );

  const resizeDebounced = debounce(() => {
    engine.resize();
  });

  window.addEventListener("resize", () => {
    resizeDebounced();

    ui.MobileControls.updateWindowSize(game);
    ui.MobileControls.updateControls({ dialog, game, mobileControlsEls });
  });
})();
