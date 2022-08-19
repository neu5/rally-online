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
    const chassisShape = new CANNON.Box(new CANNON.Vec3(2, 0.5, 1));
    const chassisBody = new CANNON.Body({ mass: 150 });
    chassisBody.addShape(chassisShape);
    chassisBody.position.set(0, 4, 0);
    chassisBody.angularVelocity.set(0, 0.5, 0);
    // demo.addVisual(chassisBody);

    // Create the vehicle
    const vehicle = new CANNON.RaycastVehicle({
      chassisBody,
    });

    const wheelOptions = {
      radius: 0.5,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 30,
      suspensionRestLength: 0.3,
      frictionSlip: 1.4,
      dampingRelaxation: 2.3,
      dampingCompression: 4.4,
      maxSuspensionForce: 100000,
      rollInfluence: 0.01,
      axleLocal: new CANNON.Vec3(0, 0, 1),
      chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1),
      maxSuspensionTravel: 0.3,
      customSlidingRotationalSpeed: -30,
      useCustomSlidingRotationalSpeed: true,
    };

    wheelOptions.chassisConnectionPointLocal.set(-1, 0, 1);
    vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(-1, 0, -1);
    vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(1, 0, 1);
    vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(1, 0, -1);
    vehicle.addWheel(wheelOptions);

    // vehicle.addToWorld(world);

    // Add the wheel bodies
    const wheelBodies = [];
    const wheelMaterial = new CANNON.Material("wheel");
    vehicle.wheelInfos.forEach((wheel) => {
      const cylinderShape = new CANNON.Cylinder(
        wheel.radius,
        wheel.radius,
        wheel.radius / 2,
        20
      );
      const wheelBody = new CANNON.Body({
        mass: 0,
        material: wheelMaterial,
      });
      wheelBody.type = CANNON.Body.KINEMATIC;
      wheelBody.collisionFilterGroup = 0; // turn off collisions
      const quaternion = new CANNON.Quaternion().setFromEuler(
        -Math.PI / 2,
        0,
        0
      );
      wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);
      wheelBodies.push(wheelBody);
      // demo.addVisual(wheelBody);
      // world.addBody(wheelBody);
    });

    player.car = vehicle;

    console.log(player);
  });

  scene.registerBeforeRender(() => {});

  return scene;
};

export { startRace };
