import {
  Body,
  Box,
  Material,
  Plane,
  RigidVehicle,
  Sphere,
  Vec3,
  World,
} from "cannon-es";

// import { buildCar } from "../model/car/car";

import type { PlayersMap } from "../index";

const carChassisSize = {
  width: 2,
  height: 0.25,
  depth: 1,
};
const carWheelSize = 0.5;

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

  // car
  const carBody = new Body({
    mass: 5,
    position: new Vec3(0, 6, 0),
    shape: new Box(
      new Vec3(
        carChassisSize.width,
        carChassisSize.height,
        carChassisSize.depth
      )
    ),
  });

  const vehicle = new RigidVehicle({
    chassisBody: carBody,
  });

  // wheels
  const mass = 1;
  const axisWidth = 5;
  const wheelShape = new Sphere(carWheelSize);
  const wheelMaterial = new Material("wheel");
  const down = new Vec3(0, -1, 0);

  const wheelBody1 = new Body({ mass, material: wheelMaterial });
  wheelBody1.addShape(wheelShape);
  wheelBody1.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody1,
    position: new Vec3(-1, 0, axisWidth / 4),
    axis: new Vec3(0, 0, 1),
    direction: down,
  });

  const wheelBody2 = new Body({ mass, material: wheelMaterial });
  wheelBody2.addShape(wheelShape);
  wheelBody2.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody2,
    position: new Vec3(-1, 0, -axisWidth / 4),
    axis: new Vec3(0, 0, 1),
    direction: down,
  });

  const wheelBody3 = new Body({ mass, material: wheelMaterial });
  wheelBody3.addShape(wheelShape);
  wheelBody3.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody3,
    position: new Vec3(1, 0, axisWidth / 4),
    axis: new Vec3(0, 0, 1),
    direction: down,
  });

  const wheelBody4 = new Body({ mass, material: wheelMaterial });
  wheelBody4.addShape(wheelShape);
  wheelBody4.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody4,
    position: new Vec3(1, 0, -axisWidth / 4),
    axis: new Vec3(0, 0, 1),
    direction: down,
  });

  vehicle.addToWorld(physicsWorld);

  // console.log(vehicle);

  playersMap.forEach((player) => {
    player.vehicle = {
      wheels: vehicle.wheelBodies.map((wheel) => ({
        index: wheel.index,
        position: wheel.position,
        quaternion: wheel.quaternion,
      })),
      chassis: {
        position: vehicle.chassisBody.position,
        quaternion: vehicle.chassisBody.quaternion,
      },
    };
  });

  // Start the simulation loop
  loop = setInterval(() => {
    physicsWorld.fixedStep();
  }, FRAME_IN_MS);
};

export { startRace };
