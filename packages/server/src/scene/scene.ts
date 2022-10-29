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
import type { Position } from "@neu5/types/src";
// import { buildCar } from "../model/car/car";

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

  function addBox({
    width,
    height,
    depth,
    position,
    mass,
    world,
  }: {
    width: number;
    height: number;
    depth: number;
    position: Position;
    mass: number;
    world: World;
  }) {
    // Physics
    const halfExtents = new Vec3(width * 0.5, height * 0.5, depth * 0.5);
    const shape = new Box(halfExtents);
    const body = new Body({ mass });
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    world.addBody(body);

    return body;
  }

  function addSphere({
    mass,
    wheelMaterial = undefined,
    position,
    radius,
    world,
  }: {
    radius: number;
    position: Position;
    mass: number;
    wheelMaterial: Material | undefined;
    world: World;
  }) {
    // Physics
    const body = new Body({
      mass,
      position: new Vec3(position.x, position.y, position.z),
      ...(wheelMaterial ? { wheelMaterial } : {}),
    });
    const shape = new Sphere(radius);
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    world.addBody(body);

    return body;
  }

  // car
  function addRigidVehicle({
    position,
    world,
  }: {
    position: Position;
    world: World;
  }) {
    const carChassisSize = {
      width: 4,
      height: 0.5,
      depth: 2,
    };
    const carWheelSize = 0.5;

    const carBody = addBox({
      mass: 5,
      position,
      width: carChassisSize.width,
      height: carChassisSize.height,
      depth: carChassisSize.depth,
      world,
    });

    // because of some reason it looks like it's upside down
    carBody.quaternion.setFromEuler(-Math.PI, 0, 0);

    const vehicle = new RigidVehicle({
      chassisBody: carBody,
    });

    // wheels
    const wheelMass = 1;
    const axisWidth = carChassisSize.width;
    const wheelMaterial = new Material("wheel");
    const down = new Vec3(0, -1, 0);

    for (let idx = 0; idx < 4; idx++) {
      const wheelBody = addSphere({
        mass: wheelMass,
        wheelMaterial,
        position: { x: 0, y: 0, z: 0 },
        radius: carWheelSize,
        world,
      });

      wheelBody.angularDamping = 0.4;
      const isFrontAxis = idx < 2 ? -1 : 1;
      const yPos = idx % 2 === 0 ? 1 : -1;

      vehicle.addWheel({
        body: wheelBody,
        position: new Vec3(isFrontAxis, 0.3, (axisWidth * yPos) / 6),
        axis: new Vec3(0, 0, isFrontAxis),
        direction: down,
      });
    }

    vehicle.addToWorld(world);

    return vehicle;
  }

  const vehicle = addRigidVehicle({
    position: {
      x: 8,
      y: 6,
      z: 0,
    },
    world: physicsWorld,
  });

  playersMap.forEach((player) => {
    player.vehicle = {
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

    playersMap.forEach(({ actions }) => {
      if (actions.accelerate) {
        vehicle.setWheelForce(maxForce, 2);
        vehicle.setWheelForce(maxForce, 3);
      } else if (actions.brake) {
        vehicle.setWheelForce(-maxForce / 2, 2);
        vehicle.setWheelForce(-maxForce / 2, 3);
      } else {
        vehicle.setWheelForce(0, 0);
        vehicle.setWheelForce(0, 1);
      }

      if (actions.left) {
        vehicle.setSteeringValue(maxSteerVal, 0);
        vehicle.setSteeringValue(maxSteerVal, 1);
      } else if (actions.right) {
        vehicle.setSteeringValue(-maxSteerVal, 0);
        vehicle.setSteeringValue(-maxSteerVal, 1);
      } else {
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
      }
    });
  }, FRAME_IN_MS);
};

export { startRace };
