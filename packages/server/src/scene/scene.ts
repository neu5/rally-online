import {
  Axis,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  Vector3,
} from "@babylonjs/core";

// import { buildCar } from "../model/car/car";

import type { Engine } from "@babylonjs/core";
import type { PlayersMap } from "../index";

// @todo: Create package with shared code #77
const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

const steeringIncrement = 0.01;
const steeringClamp = 0.2;
const maxEngineForce = 500;
const maxBreakingForce = 10;

const FRONT_LEFT = 0;
const FRONT_RIGHT = 1;
const BACK_LEFT = 2;
const BACK_RIGHT = 3;

const createScene = async (engine: Engine) => {
  const scene: Scene = new Scene(engine);

  const gravityVector = new Vector3(0, -9.81, 0);
  // const AmmoJS = await Ammo();
  // scene.enablePhysics(gravityVector, new AmmoJSPlugin());

  const ground = MeshBuilder.CreateGround(
    "ground1",
    { width: 100, height: 100, subdivisions: 2 },
    scene
  );

  // const box = MeshBuilder.CreateBox("box1");
  // box.setAbsolutePosition(new Vector3(1, 1, 1));
  // box.physicsImpostor = new PhysicsImpostor(
  //   box,
  //   PhysicsImpostor.BoxImpostor,
  //   { mass: 1, restitution: 0.2 },
  //   scene
  // );

  // car.setAbsolutePosition(new Vector3(-1, 1, 1));
  // car.rotate(new Vector3(-1, 0, 0), 1.5);

  // car.physicsImpostor = new PhysicsImpostor(
  //   car,
  //   PhysicsImpostor.BoxImpostor,
  //   { mass: 1, restitution: 0.4 },
  //   scene
  // );

  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0.9 },
    scene
  );

  return { scene };
};

const startRace = async ({
  engine,
  oldScene,
  playersMap,
}: {
  engine: Engine;
  oldScene: Scene;
  playersMap: PlayersMap;
}) => {
  oldScene.dispose();
  engine.stopRenderLoop();

  const { scene } = await createScene(engine);

  playersMap.forEach((player) => {
    // if (player.vehicle) {
    //   player.car = buildCar({
    //     AmmoJS,
    //     color: player.vehicle.color,
    //     scene,
    //     startingPos: player.vehicle.startingPos,
    //   });
    // }
  });

  // const maxSteerVal = 0.2;

  return scene;
};

export { startRace };
