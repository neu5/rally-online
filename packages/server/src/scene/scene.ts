import { Body, Plane, Vec3, World } from "cannon-es";
import { addRigidVehicle } from "../utils";

import type { PlayersMap } from "../index";

const FRAME_IN_MS = 1000 / 30; // 30 FPS
let loop = setInterval(() => {}, FRAME_IN_MS);

const startRace = async ({ playersMap }: { playersMap: PlayersMap }) => {
  clearInterval(loop);

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

  const wall1 = new Body({ type: Body.STATIC, shape: new Plane() });

  wall1.position = new Vec3(0, 50, 50);
  console.log(wall1.position);
  physicsWorld.addBody(wall1);

  // const wall1 = addPlane({ width: 100, height: 100, scene });
  // wall1.rotation = new Vector3(0, 0, 0);
  // wall1.position = new Vector3(0, 50, 50);

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
  const maxForce = 10;

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
};

export { startRace };
