import { fileURLToPath } from "url";
import { resolve } from "path";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import type { Socket } from "socket.io";
import type { Position, VehicleTemplate } from "@neu5/types/src";

import { startRace } from "./scene/scene";

type PlayerNumbers = Array<{
  idx: number;
  isFree: boolean;
}>;
const playerNumbers: PlayerNumbers = [
  {
    idx: 0,
    isFree: true,
  },
  {
    idx: 1,
    isFree: true,
  },
  {
    idx: 2,
    isFree: true,
  },
  {
    idx: 3,
    isFree: true,
  },
];

const vehicles = [
  {
    color: "BlueMaterial",
    startingPos: { x: 0, y: 5, z: 0 },
  },
  {
    color: "RedMaterial",
    startingPos: { x: 10, y: 5, z: 0 },
  },
  {
    color: "GreenMaterial",
    startingPos: { x: -10, y: 5, z: 0 },
  },
  {
    color: "YellowMaterial",
    startingPos: { x: 15, y: 5, z: 0 },
  },
];

const getDirname = (meta: { url: string }) => fileURLToPath(meta.url);
const rootDir = getDirname(import.meta);
const distDir = resolve(rootDir, "../../../", "client/dist");

const app = express();
const httpServer = createServer(app);

interface ServerToClientEvents {
  playerListUpdate: (playersList: Object) => void;
  playerID: (id: string) => void;
  "server:action": (data: Object) => void;
  "server:start-race": (data: Object) => void;
}
const io = new Server<ServerToClientEvents>(httpServer);

type Car = {
  wheelMeshes: Array<any>;
};

export type PlayersMap = Map<
  string,
  {
    accelerateTimeMS: number;
    turnTimeMS: number;
    actions: Actions;
    name: string;
    vehicle?: VehicleTemplate;
    playerNumber?: number;
    vehicleSteering: number;
    vehicleTemplate?: VehicleTemplate;
    car?: Car;
    startingPos?: Position;
  }
>;
const playersMap: PlayersMap = new Map();

const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

type ActionTypes = "accelerate" | "brake" | "left" | "right";

interface Actions {
  [ACCELERATE]: boolean;
  [BRAKE]: boolean;
  [LEFT]: boolean;
  [RIGHT]: boolean;
}
const actions: Actions = {
  [ACCELERATE]: false,
  [BRAKE]: false,
  [LEFT]: false,
  [RIGHT]: false,
} as const;

const playersMapToArray = (list: PlayersMap) =>
  Array.from(list).map(([id, { name, vehicle }]) => ({
    id,
    name,
    ...(vehicle
      ? {
          vehicle: {
            body: vehicle?.body,
            wheels: vehicle?.wheels,
          },
        }
      : undefined),
  }));

type Race = {
  isStarted: boolean;
};

const race: Race = {
  isStarted: false,
};

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
  const createSocketHandlers = (socket: Socket) => {
    socket.on("getPlayerList", () => {
      socket.emit("playerListUpdate", playersMapToArray(playersMap));
    });

    socket.on("player:start-race", async () => {
      race.isStarted = true;

      await startRace({ playersMap });

      io.emit("server:start-race", {
        playersList: playersMapToArray(playersMap),
      });
    });

    socket.on(
      "player:action",
      ({ playerActions, id }: { playerActions: ActionTypes[]; id: string }) => {
        const player = playersMap.get(id);

        if (!player || playerActions.length === 0) {
          return;
        }

        playerActions.forEach((playerAction) => {
          player.actions[playerAction] = true;

          if (playerAction === ACCELERATE) {
            player.accelerateTimeMS = Date.now();
            player.actions[BRAKE] = false;
          } else if (playerAction === BRAKE) {
            player.accelerateTimeMS = Date.now();
            player.actions[ACCELERATE] = false;
          }
          if (playerAction === LEFT) {
            player.turnTimeMS = Date.now();
            player.actions[RIGHT] = false;
          } else if (playerAction === RIGHT) {
            player.turnTimeMS = Date.now();
            player.actions[LEFT] = false;
          }
        });
      }
    );

    socket.on("disconnect", () => {
      const playerToDelete = playersMap.get(socket.id);
      const playerNumber = playerNumbers.find(
        (pNumber) => pNumber.idx === playerToDelete?.playerNumber
      );

      if (playerNumber) {
        playerNumber.isFree = true;
      }

      playersMap.delete(socket.id);

      io.emit("playerListUpdate", playersMapToArray(playersMap));
    });
  };

  io.on("connection", (socket) => {
    const playerNumber = playerNumbers.find(({ isFree }) => isFree);
    let vehicle = null;

    if (playerNumber) {
      vehicle = vehicles[playerNumber.idx];
      playerNumber.isFree = false;
    }

    playersMap.set(socket.id, {
      name: socket.id,
      actions: { ...actions },
      accelerateTimeMS: 0,
      turnTimeMS: 0,
      vehicleSteering: 0,
      ...vehicle,
      playerNumber: playerNumber?.idx,
      // ...(vehicle ? { vehicle, playerNumber: playerNumber?.idx } : {}),
    });

    createSocketHandlers(socket);

    io.emit("playerListUpdate", playersMapToArray(playersMap));

    socket.emit("playerID", socket.id);
  });

  setInterval(() => {
    const now = Date.now();

    playersMap.forEach((player) => {
      const dtAcceleration = now - player.accelerateTimeMS;
      const dtTurning = now - player.turnTimeMS;

      let newActions = { ...player.actions };

      if (dtAcceleration > 250) {
        player.accelerateTimeMS = now;
        newActions = {
          ...newActions,
          [ACCELERATE]: false,
          [BRAKE]: false,
        };
      }
      if (dtTurning > 250) {
        player.turnTimeMS = now;
        newActions = {
          ...newActions,
          [LEFT]: false,
          [RIGHT]: false,
        };
      }

      player.actions = { ...newActions };
    });

    io.emit("server:action", playersMapToArray(playersMap));
  }, 50);
})();

app.use(express.static(distDir));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: distDir });
});

export const server = httpServer.listen(process.env.PORT || 5000);
