import { io } from "socket.io-client";
import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { startRace } from "./scene/scene";
import { UIDialogWrapper, UIcreatePlayersList, UIsetCurrentPlayer } from "./ui";

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
  // share sockets interfaces?
  const socket: Socket<ServerToClientEvents> = io();

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
            spherePos: { x: 0, y: 0, z: 0 },
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
    const scene = new Scene();
    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(7, 15, 15);

    const renderer = new WebGLRenderer({ canvas });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const controls = new OrbitControls(camera, renderer.domElement);

    const newScene = await startRace({
      camera,
      controls,
      playersMap: game.playersMap,
      renderer,
      scene,
      sendAction,
      socket,
    });
  });

  startBtn.addEventListener("click", async () => {
    socket.emit("player:start-race");
  });

  window.addEventListener("resize", () => {
    // renderer.resize();

    updateWindowSize();
    updateControls();
  });
})();
