import { fileURLToPath } from "url";
import { resolve } from "path";
import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { ArcRotateCamera, NullEngine, Vector3 } from "@babylonjs/core";

import { createScene } from "./scene/scene";

// type CarPosition = {
//   x: number;
//   y: number;
//   z: number;
// };
// const carsStartingPositions: Array<CarPosition> = [
//   { x: 0, y: 5, z: 0 },
//   { x: 10, y: 5, z: 0 },
//   { x: -10, y: 5, z: 0 },
//   { x: 15, y: 5, z: 0 },
// ];

const getDirname = (meta: { url: string }) => fileURLToPath(meta.url);
const rootDir = getDirname(import.meta);
const distDir = resolve(rootDir, "../../../", "client/dist");

const app = express();
const httpServer = createServer(app);

interface ServerToClientEvents {
  playerListUpdate: (playersList: Object) => void;
  playerID: (id: string) => void;
  "server:action": (data: Object) => void;
}
const io = new Server<ServerToClientEvents>(httpServer);

const playersList = new Map();

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
let actions: Actions = {
  [ACCELERATE]: false,
  [BRAKE]: false,
  [LEFT]: false,
  [RIGHT]: false,
};

let accelerateTimeMS = 0;
let turnTimeMS = 0;

(async () => {
  const engine = new NullEngine();
  const scene = await createScene(engine);

  const camera = new ArcRotateCamera( // eslint-disable-line
    "camera",
    -Math.PI / 2,
    Math.PI / 3.5,
    130,
    Vector3.Zero()
  );

  const createSocketHandlers = (socket: Socket) => {
    socket.on("player:action", ({ action }: { action: ActionTypes }) => {
      actions[action] = true;

      if (action === ACCELERATE) {
        accelerateTimeMS = Date.now();
        actions[BRAKE] = false;
      } else if (action === BRAKE) {
        accelerateTimeMS = Date.now();
        actions[ACCELERATE] = false;
      } else if (action === LEFT) {
        turnTimeMS = Date.now();
        actions[RIGHT] = false;
      } else if (action === RIGHT) {
        turnTimeMS = Date.now();
        actions[LEFT] = false;
      }
    });

    socket.on("disconnect", () => {
      playersList.delete(socket.id);

      io.emit(
        "playerListUpdate",
        Array.from(playersList, ([id, data]) => ({ id, data }))
      );
    });
  };

  io.on("connection", (socket) => {
    playersList.set(socket.id, { name: socket.id });

    createSocketHandlers(socket);

    io.emit(
      "playerListUpdate",
      Array.from(playersList, ([id, data]) => ({ id, data }))
    );

    socket.emit("playerID", socket.id);
  });

  setInterval(() => {
    const now = Date.now();
    const dtAcceleration = now - accelerateTimeMS;
    const dtTurning = now - turnTimeMS;

    if (dtAcceleration > 200) {
      actions = {
        ...actions,
        [ACCELERATE]: false,
        [BRAKE]: false,
      };
    }
    if (dtTurning > 200) {
      actions = {
        ...actions,
        [LEFT]: false,
        [RIGHT]: false,
      };
    }

    io.emit("server:action", actions);
  }, 50);

  engine.runRenderLoop(() => {
    scene.render();
  });
})();

app.use(express.static(distDir));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: distDir });
});

export const server = httpServer.listen(process.env.PORT || 5000);
