// import { addRigidVehicle, getMapWalls } from "../utils";
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
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import type { Actions, GameServer } from "@neu5/types/src";
import type { Engine, GroundMesh } from "@babylonjs/core";
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

const createGround = (scene: Scene) => {
  // Our built-in 'ground' shape.
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: groundSize, height: groundSize },
    scene
  );

  return ground;
};

const createSphere = (ground: GroundMesh, scene: Scene) => {
  // Our built-in 'sphere' shape.
  const sphere = MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 2, segments: 32 },
    scene
  );

  sphere.position.y = 20;

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

  return sphere;
};

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

  // initialize plugin
  const havokInstance = await getInitializedHavok();

  // pass the engine to the plugin
  const hk = new HavokPlugin(true, havokInstance);
  // // enable physics in the scene with a gravity
  scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

  // createHeightmap({
  //   scene,
  //   material: groundPhysicsMaterial,
  // });

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

      const vehiclesTemplate = vehicles[playerNumber.idx];
      playerNumber.isFree = false;

      return {
        accelerateTimeMS: 0,
        actions: { ...actions },
        turnTimeMS: 0,
        vehicleSteering: 0,
        playerNumber: playerNumber?.idx,
        ...player,
        ...vehiclesTemplate,
      };
    });

  playersMap.forEach((player) => {
    player.sphere = createSphere(ground, scene);

    // const vehicle = addRigidVehicle({
    //   position: {
    //     x: player?.startingPos?.x || 0,
    //     y: player?.startingPos?.y || 0,
    //     z: player?.startingPos?.z || 0,
    //   },
    //   world: physicsWorld,
    // });
    // player.vehicle = {
    //   physicalVehicle: vehicle,
    //   wheels: vehicle.wheelBodies.map((wheel) => ({
    //     position: wheel.position,
    //     quaternion: wheel.quaternion,
    //   })),
    //   body: {
    //     position: vehicle.chassisBody.position,
    //     quaternion: vehicle.chassisBody.quaternion,
    //   },
    // };
  });

  //   const maxSteerVal = Math.PI / 8;
  //   const maxForce = 50;

  // Start the simulation loop
  loop = setInterval(() => {
    // physicsWorld.fixedStep();

    playersMap.forEach(({ actions: playersActions, vehicle }) => {
      if (!vehicle) {
        return;
      }

      //   if (playersActions.accelerate) {
      //     vehicle.physicalVehicle.setWheelForce(maxForce, 2);
      //     vehicle.physicalVehicle.setWheelForce(maxForce, 3);
      //   } else if (playersActions.brake) {
      //     vehicle.physicalVehicle.setWheelForce(-maxForce / 2, 2);
      //     vehicle.physicalVehicle.setWheelForce(-maxForce / 2, 3);
      //   } else {
      //     vehicle.physicalVehicle.setWheelForce(0, 2);
      //     vehicle.physicalVehicle.setWheelForce(0, 3);
      //   }
      //   if (playersActions.left) {
      //     vehicle.physicalVehicle.setSteeringValue(maxSteerVal, 0);
      //     vehicle.physicalVehicle.setSteeringValue(maxSteerVal, 1);
      //   } else if (playersActions.right) {
      //     vehicle.physicalVehicle.setSteeringValue(-maxSteerVal, 0);
      //     vehicle.physicalVehicle.setSteeringValue(-maxSteerVal, 1);
      //   } else {
      //     vehicle.physicalVehicle.setSteeringValue(0, 0);
      //     vehicle.physicalVehicle.setSteeringValue(0, 1);
      //   }
    });
  }, FRAME_IN_MS);

  return { loop, playersMap };
};

export { startRace };
