import { createGround, createSphere } from "../utils";
import { fileURLToPath } from "url";
import {
  ArcRotateCamera,
  HavokPlugin,
  MeshBuilder,
  NullEngine,
  // PhysicsAggregate,
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeMesh,
  // PhysicsShapeType,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import type { Actions, GameServer } from "@neu5/types/src";
import type { Engine } from "@babylonjs/core";
import type { Room } from "../room";
import type { InMemorySessionStore } from "../sessionStore";

import * as path from "path";
import * as fs from "fs";

const getDirname = (meta: { url: string }) => fileURLToPath(meta.url);
const rootDir = getDirname(import.meta);

const wasm = path.join(
  rootDir,
  "../../../../../",
  "node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm"
);

const mapPath = path.join(rootDir, "../../../", "src/assets/heightmap.png");

const FRAME_IN_MS = 1000 / 30; // 30 FPS
let loop = setInterval(() => {}, FRAME_IN_MS);

const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

const actions: Actions = {
  [ACCELERATE]: false,
  [BRAKE]: false,
  [LEFT]: false,
  [RIGHT]: false,
} as const;

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
    startingPos: { x: 0, y: 10, z: 0 },
  },
  {
    color: "RedMaterial",
    startingPos: { x: 10, y: 10, z: 0 },
  },
  {
    color: "GreenMaterial",
    startingPos: { x: -10, y: 10, z: 0 },
  },
  {
    color: "YellowMaterial",
    startingPos: { x: 15, y: 10, z: 0 },
  },
];

const groundSize = 100;
let groundPhysicsMaterial = { friction: 0.2, restitution: 0.3 };

const createHeightmap = ({
  scene,
  mapInBase64,
  material,
}: {
  scene: Scene;
  mapInBase64: string;
  // @ts-ignore
  material: Material;
}) => {
  const ground = MeshBuilder.CreateGroundFromHeightMap(
    "ground",
    mapInBase64,
    {
      width: groundSize,
      height: groundSize,
      subdivisions: 100,
      maxHeight: 10,
      onReady: (mesh) => {
        mesh.material = new StandardMaterial("heightmapMaterial");

        const groundShape = new PhysicsShapeMesh(ground, scene);

        const body = new PhysicsBody(
          ground,
          PhysicsMotionType.STATIC,
          false,
          scene
        );

        groundShape.material = material;
        body.shape = groundShape;
        body.setMassProperties({
          mass: 0,
        });
      },
    },
    scene
  );
};

const getInitializedHavok = async () => {
  try {
    const binary = fs.readFileSync(wasm);
    return await HavokPhysics({ wasmBinary: binary });
  } catch (e) {
    return e;
  }
};

const getMap = () => {
  const map = fs.readFileSync(mapPath);

  return "data:image/png;base64,".concat(Buffer.from(map).toString("base64"));
};

const createScene = async (engine: Engine) => {
  // This creates a basic Babylon Scene object (non-mesh)
  const scene = new Scene(engine);

  // This creates and positions a free camera (non-mesh)
  // eslint-disable-next-line
  const camera = new ArcRotateCamera(
    "camera1",
    -Math.PI / 2,
    0.8,
    200,
    new Vector3(0, 0, 0)
  );

  // initialize plugin
  const havokInstance = await getInitializedHavok();

  // pass the engine to the plugin
  const hk = new HavokPlugin(true, havokInstance);
  // enable physics in the scene with a gravity
  scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

  return scene;
};

const startRace = async ({
  game,
  room,
  sessionStore,
}: {
  game: GameServer;
  room: Room;
  sessionStore: InMemorySessionStore;
}) => {
  clearInterval(loop);
  game.objects = [];

  const engine = new NullEngine();
  const scene = await createScene(engine);

  const ground = createGround(scene);

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

  if (game.config) {
    // const walls = getMapWalls(game.config, physicsWorld);
    // walls.forEach(({ position, quaternion }, i: number) => {
    //   game.objects.push({
    //     name: `wall${i}`,
    //     isWall: true,
    //     position,
    //     quaternion,
    //     ...game.config,
    //   });
    // });
  }

  const socketsInTheRoom = room.getMembers();
  const playersMap = socketsInTheRoom
    .map((sessionID: string) => sessionStore.findSession(sessionID))
    .map((player) => {
      const playerNumber = playerNumbers.find(({ isFree }) => isFree);

      if (!playerNumber) {
        return;
      }

      const vehicleTemplate = vehicles[playerNumber.idx];
      playerNumber.isFree = false;

      return {
        accelerateTimeMS: 0,
        actions: { ...actions },
        turnTimeMS: 0,
        vehicleSteering: 0,
        playerNumber: playerNumber?.idx,
        ...player,
        ...vehicleTemplate,
      };
    });

  playersMap.forEach((player) => {
    player.sphere = createSphere({
      ground,
      scene,
      startingPos: player.startingPos,
    });
  });

  const mapInBase64 = await getMap();

  createHeightmap({
    scene,
    mapInBase64,
    material: groundPhysicsMaterial,
  });

  // Start the simulation loop
  loop = setInterval(() => {
    // physicsWorld.fixedStep();

    playersMap.forEach(({ vehicle }) => {
      if (!vehicle) {
        return;
      }
    });
  }, FRAME_IN_MS);

  return { loop, playersMap };
};

export { startRace };
