import { io } from "socket.io-client";
import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import * as CANNON from "cannon-es";

import { startRace } from "./scene/scene";
import { UIDialogWrapper, UIcreatePlayersList, UIsetCurrentPlayer } from "./ui";

// import type { Mesh } from "@babylonjs/core";
import type { Socket } from "socket.io-client";
import type { Player, VehicleTemplate } from "@neu5/types/src";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const FPSEl = document.getElementById("fps") as HTMLElement;
const startBtn = document.getElementById("start-btn") as HTMLAnchorElement;
const playersListEl = document.getElementById("players-list") as HTMLElement;

type Car = {
  wheelMeshes: Array<any>;
};

export type PlayersMap = Map<
  string,
  Player & {
    car?: Car;
  }
>;

type GameType = {
  playersMap: PlayersMap;
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

const verticalMobileDialog = new UIDialogWrapper();

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
    verticalMobileDialog.show({
      content: pEl,
    });
  }
};

updateWindowSize();
updateControls();

let currentPlayerId: string | undefined = undefined;

interface ServerToClientEvents {
  playerListUpdate: (playersList: Array<PlayersMap>) => void;
  playerID: (id: string) => void;
  "server:action": (data: Object) => void;
  "server:start-race": (data: Object) => void;
  "player:action": (data: Object) => void;
  getPlayerList: () => void;
  "player:start-race": () => void;
}

(async () => {
  let engine: Engine = new Engine(canvas);

  let scene: Scene = new Scene(engine);
  // share sockets interfaces?
  const socket: Socket<ServerToClientEvents> = io();

  const shapeWorldPosition = new CANNON.Vec3();
  const shapeWorldQuaternion = new CANNON.Quaternion();

  const updateMeshPositions = ({ world, bodies, meshes }) => {
    let meshIndex = 0;
    for (const body of world.bodies) {
      for (let i = 0; i !== body.shapes.length; i++) {
        const mesh = meshes[meshIndex];

        if (mesh) {
          // Get world position
          body.quaternion.vmult(body.shapeOffsets[i], shapeWorldPosition);
          body.position.vadd(shapeWorldPosition, shapeWorldPosition);
          // Get world quaternion
          body.quaternion.mult(body.shapeOrientations[i], shapeWorldQuaternion);
          mesh.position.set(
            shapeWorldPosition.x,
            shapeWorldPosition.y,
            shapeWorldPosition.z
          );

          if (mesh.rotationQuaternion) {
            mesh.rotationQuaternion.set(
              shapeWorldQuaternion.x,
              shapeWorldQuaternion.y,
              shapeWorldQuaternion.z,
              shapeWorldQuaternion.w
            );
          }
        }
        meshIndex++;
      }
    }
  };

  const startEngineLoop = ({ bodies, meshes, world }) => {
    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 3.5,
      // 130,
      20,
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
      world.fixedStep();

      scene.render();

      updateMeshPositions({ bodies, meshes, world });

      FPSEl.textContent = `${engine.getFps().toFixed()} fps`;
    });
  };

  const sendAction = (playerActions: string[]) => {
    socket.emit("player:action", {
      id: currentPlayerId,
      playerActions,
    });
  };

  socket.on(
    "playerListUpdate",
    // @ts-ignore
    (
      playersList: Array<{
        name: string;
        vehicle: VehicleTemplate;
      }>
    ) => {
      game.playersMap.clear();

      playersList.forEach(
        ({ name, vehicle }: { name: string; vehicle: VehicleTemplate }) => {
          game.playersMap.set(name, {
            name,
            vehicle,
            isCurrentPlayer: name === currentPlayerId,
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

  socket.on("playerID", (id: string) => {
    currentPlayerId = id;
    socket.emit("getPlayerList");
  });

  socket.on("server:start-race", async () => {
    const { newScene, bodies, meshes, world } = await startRace({
      engine,
      oldScene: scene,
      playersMap: game.playersMap,
      sendAction,
      socket,
    });

    scene = newScene;
    startEngineLoop({ bodies, meshes, world });
  });

  startBtn.addEventListener("click", async () => {
    socket.emit("player:start-race");
  });

  window.addEventListener("resize", () => {
    engine.resize();

    updateWindowSize();
    updateControls();
  });
})();
