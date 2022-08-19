import {
  CannonJSPlugin,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  Vector3,
} from "@babylonjs/core";
import * as CANNON from "cannon-es";

import type { Socket } from "socket.io-client";
import type { Engine } from "@babylonjs/core";

import type { PlayersMap } from "../main";
import { UIPlayersIndicators } from "../ui";

const speedometerEl = document.getElementById("speedometer") as HTMLElement;

const createScene = async (engine: Engine) => {
  const scene: Scene = new Scene(engine);

  const gravityVector = new Vector3(0, -9.81, 0);
  const cannonPlugin = new CannonJSPlugin(true, 10, CANNON);
  scene.enablePhysics(gravityVector, cannonPlugin);

  const ground = MeshBuilder.CreateGround(
    "ground1",
    { width: 100, height: 100, subdivisions: 2 },
    scene
  );

  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0.9 },
    scene
  );

  return { scene };
};

const playersIndicatorsEl = document.getElementById(
  "players-indicators"
) as HTMLElement;

const startRace = async ({
  engine,
  oldScene,
  playersMap,
  sendAction,
  socket,
}: {
  engine: Engine;
  oldScene: Scene;
  playersMap: PlayersMap;
  sendAction: Function;
  socket: Socket;
}) => {
  oldScene.dispose();
  engine.stopRenderLoop();
  socket.off("server:action");

  const { scene } = await createScene(engine);

  const physicsEngine = scene.getPhysicsEngine();

  if (physicsEngine === null) {
    throw new Error("Physics Engine is null");
  }

  const physicsWorld = physicsEngine.getPhysicsPlugin().world;

  playersMap.forEach((player) => {
    // Build the car chassis
    const chassisShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 2));
    const chassisBody = new CANNON.Body({ mass: 1 });
    const centerOfMassAdjust = new CANNON.Vec3(0, -1, 0);
    chassisBody.addShape(chassisShape, centerOfMassAdjust);

    // physicsWorld.addRigidBody(chassisBody);
    //  demo.addVisual(chassisBody)

    // Create the vehicle
    const vehicle = new CANNON.RigidVehicle({
      chassisBody,
    });

    const mass = 1;
    const axisWidth = 7;
    const wheelShape = new CANNON.Sphere(1.5);
    const wheelMaterial = new CANNON.Material("wheel");
    const down = new CANNON.Vec3(0, -1, 0);

    const wheelBody1 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody1.addShape(wheelShape);
    vehicle.addWheel({
      body: wheelBody1,
      position: new CANNON.Vec3(-5, 0, axisWidth / 2).vadd(centerOfMassAdjust),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const wheelBody2 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody2.addShape(wheelShape);
    vehicle.addWheel({
      body: wheelBody2,
      position: new CANNON.Vec3(-5, 0, -axisWidth / 2).vadd(centerOfMassAdjust),
      axis: new CANNON.Vec3(0, 0, -1),
      direction: down,
    });

    const wheelBody3 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody3.addShape(wheelShape);
    vehicle.addWheel({
      body: wheelBody3,
      position: new CANNON.Vec3(5, 0, axisWidth / 2).vadd(centerOfMassAdjust),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const wheelBody4 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody4.addShape(wheelShape);
    vehicle.addWheel({
      body: wheelBody4,
      position: new CANNON.Vec3(5, 0, -axisWidth / 2).vadd(centerOfMassAdjust),
      axis: new CANNON.Vec3(0, 0, -1),
      direction: down,
    });

    vehicle.wheelBodies.forEach((wheelBody) => {
      // Some damping to not spin wheels too fast
      wheelBody.angularDamping = 0.4;

      // Add visuals
      // demo.addVisual(wheelBody);
    });

    // vehicle.addToWorld(world);

    player.car = vehicle;

    console.log(player);
  });

  scene.registerBeforeRender(() => {});

  return scene;
};

export { startRace };
