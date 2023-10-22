import { fileURLToPath } from "url";
import {
  ArcRotateCamera,
  HavokPlugin,
  MeshBuilder,
  NullEngine,
  PhysicsAggregate,
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeMesh,
  PhysicsShapeType,
  Scene,
  Vector3,
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import type { Server, Socket } from "socket.io";
import type {
  ActionTypes,
  GameServer,
  PlayersList,
  ServerToClientEvents,
  User,
} from "@neu5/types/src";
import * as path from "path";
import * as fs from "fs";

const getDirname = (meta: { url: string }) => fileURLToPath(meta.url);
const rootDir = getDirname(import.meta);

import type { Engine } from "@babylonjs/core";
import type { InMemorySessionStore } from "../sessionStore";
import { Room } from "../room";

console.log(rootDir);

const wasm = path.join(
  rootDir,
  "../../../../../node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm"
);
// import { startRace } from "../scene/scene";

const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

let raceLoop: NodeJS.Timer | null = null;

let playersMap: PlayersList | null = null;

const roomRace = new Room();

const groundSize = 100;
let groundPhysicsMaterial = { friction: 0.2, restitution: 0.3 };

async function getInitializedHavok() {
  try {
    let binary = fs.readFileSync(wasm);
    return HavokPhysics({ wasmBinary: binary });
  } catch (e) {
    return e;
  }
}

const createScene = async function (engine: Engine) {
  // This creates a basic Babylon Scene object (non-mesh)
  const scene = new Scene(engine);

  // This creates and positions a free camera (non-mesh)
  const camera = new ArcRotateCamera(
    "camera1",
    -Math.PI / 2,
    0.8,
    200,
    new Vector3(0, 0, 0)
  );

  // Our built-in 'sphere' shape.
  const sphere = MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 2, segments: 32 },
    scene
  );

  // Move the sphere upward at 4 units
  sphere.position.y = 20;

  // Our built-in 'ground' shape.
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: groundSize, height: groundSize },
    scene
  );

  // initialize plugin
  const havokInstance = await getInitializedHavok();

  // pass the engine to the plugin
  const hk = new HavokPlugin(true, havokInstance);
  // // enable physics in the scene with a gravity
  scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

  // // Create a sphere shape and the associated body. Size will be determined automatically.
  // // eslint-disable-next-line
  const sphereAggregate = new PhysicsAggregate(
    sphere,
    PhysicsShapeType.SPHERE,
    { mass: 1, restitution: 0.75 },
    scene
  );

  // // Create a static box shape.
  // // eslint-disable-next-line
  const groundAggregate = new PhysicsAggregate(
    ground,
    PhysicsShapeType.BOX,
    { mass: 0 },
    scene
  );

  // createHeightmap({
  //   scene,
  //   material: groundPhysicsMaterial,
  // });

  return scene;
};

const playersMapToArray = (list: PlayersList) =>
  list.map(({ color, username, userID, vehicle }) => ({
    color,
    username,
    userID,
    ...(vehicle
      ? {
          vehicle: {
            body: vehicle?.body,
            wheels: vehicle?.wheels,
          },
        }
      : undefined),
  }));

const emitRoomInfo = async ({
  io,
  room,
  sessionStore,
}: {
  io: Server<ServerToClientEvents>;
  room: Room;
  sessionStore: InMemorySessionStore;
}) => {
  const socketsInTheRoom = room.getMembers();

  io.emit(
    "server:send room users",
    socketsInTheRoom.map((sessionID) => sessionStore.findSession(sessionID))
  );
};

const createSocketHandlers = ({
  game,
  io,
  sessionStore,
  socket,
}: {
  game: GameServer;
  io: Server<ServerToClientEvents>;
  sessionStore: InMemorySessionStore;
  socket: Socket<ServerToClientEvents>;
}) => {
  // persist session
  sessionStore.saveSession(socket.data.sessionID, {
    connected: true,
    userID: socket.data.userID,
    username: socket.data.username,
  });

  socket.emit("server:session", {
    sessionID: socket.data.sessionID,
    userID: socket.data.userID,
  });

  if (socket.data.username) {
    // notify existing users
    socket.broadcast.emit("server:user connected", {
      connected: socket.data.connected,
      userID: socket.data.userID,
      username: socket.data.username,
    });

    io.emit("server:send users", sessionStore.getAuthorizedUsers());
    socket.emit("server:close dialog");
  }

  socket.on("client:set name", ({ username }) => {
    const user: User = sessionStore.findSession(socket.data.sessionID);

    if (!user) {
      return;
    }
    if (
      !(
        typeof username === "string" &&
        username.length >= 3 &&
        username.length <= 16 &&
        /^[\w]+$/.test(username)
      )
    ) {
      socket.emit("server:show error", { message: "Wrong input" });
      return;
    }
    let isPlayerNameAlreadyTaken: boolean = false;
    sessionStore.findAllSessions().forEach((u) => {
      if (u.username === username) {
        isPlayerNameAlreadyTaken = true;
      }
    });
    if (isPlayerNameAlreadyTaken) {
      socket.emit("server:show error", {
        message: "That name is already taken. Choose different name",
      });
      return;
    }

    sessionStore.saveSession(socket.data.sessionID, {
      ...user,
      username,
    });

    io.emit("server:send users", sessionStore.getAuthorizedUsers());
    emitRoomInfo({ io, room: roomRace, sessionStore });

    if (!game.race.isStarted) {
      socket.emit("server:user can join the room");
    }

    socket.emit("server:close dialog");
  });

  socket.on(
    "client:action",
    ({
      playerActions,
      id,
    }: {
      playerActions: Array<ActionTypes>;
      id: string;
    }) => {
      if (playersMap === null) {
        return;
      }

      const player = playersMap.find((p) => p.userID === id);

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

  socket.on("client:join race room", async () => {
    if (game.race.isStarted) {
      socket.emit("server:show error", {
        message: "The race is already going on! You can't join the room now.",
      });
      return;
    }

    roomRace.join(socket.data.sessionID);

    emitRoomInfo({ io, room: roomRace, sessionStore });

    socket.emit("server:user can leave the room");
    socket.emit("server:user can start the race");
  });

  socket.on("client:leave race room", async () => {
    roomRace.leave(socket.data.sessionID);

    emitRoomInfo({ io, room: roomRace, sessionStore });

    socket.emit("server:user can join the room");
    socket.emit("server:user cannot start the race");
  });

  socket.on("client:start the race", async () => {
    if (game.race.isStarted) {
      socket.emit("server:show error", {
        message: "The race is already going on!",
      });
      return;
    }

    game.race.isStarted = true;
    game.config = {
      width: 100,
      height: 100,
      depth: 0.1,
    };

    const engine = new NullEngine();
    const scene = await createScene(engine);

    const camera = new ArcRotateCamera( // eslint-disable-line
      "camera",
      -Math.PI / 2,
      Math.PI / 3.5,
      130,
      Vector3.Zero()
    );

    engine.runRenderLoop(() => {
      scene.render();
    });

    // const race = await startRace({ game, room: roomRace, sessionStore });
    // raceLoop = race.loop;
    // playersMap = race.playersMap;

    // io.emit("server:start-race", {
    //   playersList: playersMapToArray(playersMap),
    //   isRaceStarted: game.race.isStarted,
    //   config: game.config,
    //   objects: game.objects.map(({ isWall, name, position, quaternion }) => ({
    //     name,
    //     isWall,
    //     position,
    //     quaternion,
    //     ...game.config,
    //   })),
    // });
  });

  socket.on("client-dev:stop the race", async () => {
    if (process.env.NODE_ENV === "development" && raceLoop) {
      clearInterval(raceLoop);
    }
  });

  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.data.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;

    const user: User = sessionStore.findSession(socket.data.sessionID);

    if (isDisconnected) {
      // update the connection status of the session
      sessionStore.saveSession(socket.data.sessionID, {
        ...user,
        connected: false,
      });
      // notify other users
      socket.broadcast.emit("server:user disconnected", socket.data.userID);

      io.emit("server:send users", sessionStore.getAuthorizedUsers());
    }
  });

  setInterval(() => {
    const now = Date.now();

    if (playersMap === null) {
      return;
    }

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
};

export { createSocketHandlers };
