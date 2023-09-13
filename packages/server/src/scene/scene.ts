import { Body, Plane, Vec3, World } from "cannon-es";
import { addRigidVehicle, getMapWalls } from "../utils";

import type { Game } from "../index";
import type { Room } from "../room";
import type { InMemorySessionStore } from "../sessionStore";

const FRAME_IN_MS = 1000 / 30; // 30 FPS
let loop = setInterval(() => { }, FRAME_IN_MS);

const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

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

const startRace = async ({
  game,
  room,
  sessionStore,
}: {
  game: Game;
  room: Room;
  sessionStore: InMemorySessionStore;
}) => {
  clearInterval(loop);
  game.objects = [];

  // physics world
  const physicsWorld = new World({
    gravity: new Vec3(0, -9.82, 0),
  });

  // Create a static plane for the ground
  const groundBody = new Body({
    type: Body.STATIC, // can also be achieved by setting the mass to 0
    shape: new Plane(),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
  physicsWorld.addBody(groundBody);

  if (game.config) {
    const walls = getMapWalls(game.config, physicsWorld);

    walls.forEach(({ position, quaternion }, i: number) => {
      game.objects.push({
        name: `wall${i}`,
        isWall: true,
        position,
        quaternion,
        ...game.config,
      });
    });
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
        vehicle: {},
        turnTimeMS: 0,
        vehicleSteering: 0,
        playerNumber: playerNumber?.idx,
        ...player,
        ...vehiclesTemplate,
      };
    });

  playersMap.forEach((player) => {
    const vehicle = addRigidVehicle({
      position: {
        x: player?.startingPos?.x || 0,
        y: player?.startingPos?.y || 0,
        z: player?.startingPos?.z || 0,
      },
      world: physicsWorld,
    });

    player.vehicle = {
      physicalVehicle: vehicle,
      wheels: vehicle.wheelBodies.map((wheel) => ({
        position: wheel.position,
        quaternion: wheel.quaternion,
      })),
      body: {
        position: vehicle.chassisBody.position,
        quaternion: vehicle.chassisBody.quaternion,
      },
    };
  });

  const maxSteerVal = Math.PI / 8;
  const maxForce = 50;

  // Start the simulation loop
  loop = setInterval(() => {
    physicsWorld.fixedStep();

    playersMap.forEach(({ actions, vehicle }) => {
      if (!vehicle) {
        return;
      }

      if (actions.accelerate) {
        vehicle.physicalVehicle.setWheelForce(maxForce, 2);
        vehicle.physicalVehicle.setWheelForce(maxForce, 3);
      } else if (actions.brake) {
        vehicle.physicalVehicle.setWheelForce(-maxForce / 2, 2);
        vehicle.physicalVehicle.setWheelForce(-maxForce / 2, 3);
      } else {
        vehicle.physicalVehicle.setWheelForce(0, 2);
        vehicle.physicalVehicle.setWheelForce(0, 3);
      }
      if (actions.left) {
        vehicle.physicalVehicle.setSteeringValue(maxSteerVal, 0);
        vehicle.physicalVehicle.setSteeringValue(maxSteerVal, 1);
      } else if (actions.right) {
        vehicle.physicalVehicle.setSteeringValue(-maxSteerVal, 0);
        vehicle.physicalVehicle.setSteeringValue(-maxSteerVal, 1);
      } else {
        vehicle.physicalVehicle.setSteeringValue(0, 0);
        vehicle.physicalVehicle.setSteeringValue(0, 1);
      }
    });
  }, FRAME_IN_MS);

  return { loop, playersMap };
};

export { startRace };
