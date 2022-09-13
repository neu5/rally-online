// import {
//   Axis,
//   CannonJSPlugin,
//   MeshBuilder,
//   PhysicsImpostor,
//   Scene,
//   Vector3,
// } from "@babylonjs/core";
import * as CANNON from "cannon-es";

// import { buildCar } from "../model/car/car";

import type { PlayersMap } from "../index";

const chassisWidth = 1;
const chassisHeight = 0.5;
const chassisDepth = 2;
const massVehicle = 50;

const massWheel = 30;

const FRAME_IN_MS = 1000 / 30; // 30 FPS
let loop = setInterval(() => {}, FRAME_IN_MS);

const startRace = async ({ playersMap }: { playersMap: PlayersMap }) => {
  clearInterval(loop);

  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });

  // Create a sphere body
  const radius = 1; // m
  const sphereBody = new CANNON.Body({
    mass: 5, // kg
    shape: new CANNON.Sphere(radius),
  });
  sphereBody.position.set(0, 10, 0); // m
  world.addBody(sphereBody);

  // Create a static plane for the ground
  const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
    shape: new CANNON.Plane(),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
  world.addBody(groundBody);

  playersMap.forEach((player) => {
    player.spherePos = sphereBody.position;
  });

  // Start the simulation loop
  loop = setInterval(() => {
    world.fixedStep();

    // the sphere y position shows the sphere falling
  }, FRAME_IN_MS);
};

export { startRace };
