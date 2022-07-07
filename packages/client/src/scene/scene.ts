import {
  AmmoJSPlugin,
  Engine,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  Vector3,
} from "@babylonjs/core";
import Ammo from "ammojs-typed";
import { Socket } from "socket.io-client";

import { buildCar } from "../model/car/car";
import { addColors, addWheelMaterial } from "../utils";

const createScene = async (engine: Engine) => {
  const scene: Scene = new Scene(engine);

  const gravityVector = new Vector3(0, -9.81, 0);
  const AmmoJS = await Ammo();
  scene.enablePhysics(gravityVector, new AmmoJSPlugin());

  const ground = MeshBuilder.CreateGround(
    "ground1",
    { width: 100, height: 100, subdivisions: 2 },
    scene
  );

  addColors(scene);
  addWheelMaterial();

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

  return { AmmoJS, scene };
};

const startRace = async ({
  engine,
  oldScene,
  sendAction,
  socket,
}: {
  engine: Engine;
  oldScene: Scene;
  sendAction: Function;
  socket: Socket;
}) => {
  oldScene.dispose();
  engine.stopRenderLoop();
  socket.off("server:action");

  const { AmmoJS, scene } = await createScene(engine);

  const vehicles = [
    {
      AmmoJS,
      color: "BlueMaterial",
      isCurrentPlayer: true,
      scene,
      startingPos: { x: 0, y: 5, z: 0 },
    },
    {
      AmmoJS,
      color: "RedMaterial",
      scene,
      startingPos: { x: 10, y: 5, z: 0 },
    },
    {
      AmmoJS,
      color: "GreenMaterial",
      scene,
      startingPos: { x: -10, y: 5, z: 0 },
    },
    {
      AmmoJS,
      color: "YellowMaterial",
      scene,
      startingPos: { x: 15, y: 5, z: 0 },
    },
  ].map((car) => buildCar(car, sendAction));

  socket.on("server:action", (data: {}) => {
    vehicles.forEach((vehicle) => vehicle.updateAction(data));
  });

  return scene;
};

export { createScene, startRace };
