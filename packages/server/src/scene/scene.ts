import { Body, Plane, Sphere, Vec3, World } from "cannon-es";

// import { buildCar } from "../model/car/car";

import type { PlayersMap } from "../index";

const FRAME_IN_MS = 1000 / 30; // 30 FPS
let loop = setInterval(() => {}, FRAME_IN_MS);

const startRace = async ({ playersMap }: { playersMap: PlayersMap }) => {
  clearInterval(loop);

  const physicsWorld = new World({
    gravity: new Vec3(0, -9.82, 0),
  });

  // Create a sphere body
  const radius = 1; // m
  const sphereBody = new Body({
    mass: 5, // kg
    shape: new Sphere(radius),
  });
  sphereBody.position.set(0, 10, 0); // m
  physicsWorld.addBody(sphereBody);

  // Create a static plane for the ground
  const groundBody = new Body({
    type: Body.STATIC, // can also be achieved by setting the mass to 0
    shape: new Plane(),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
  physicsWorld.addBody(groundBody);

  playersMap.forEach((player) => {
    player.spherePos = sphereBody.position;
  });

  // Start the simulation loop
  loop = setInterval(() => {
    physicsWorld.fixedStep();
  }, FRAME_IN_MS);
};

export { startRace };
