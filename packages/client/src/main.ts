import { io } from "socket.io-client";
import { Engine } from "@babylonjs/core";

import { startRace } from "./scene/scene";
import { UIDialogWrapper, UIcreatePlayersList, UIsetCurrentPlayer } from "./ui";

import type { Socket } from "socket.io-client";
import type { Player } from "@neu5/types/src";

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
  const engine = new Engine(canvas, true);
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
        vehicle: any;
      }>
    ) => {
      game.playersMap.clear();

      playersList.forEach(
        ({ name, vehicle }: { name: string; vehicle: any }) => {
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
    await startRace({
      canvas,
      engine,
      playersMap: game.playersMap,
      sendAction,
      socket,
      FPSEl,
    });
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
