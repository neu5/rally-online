import {
  AmmoJSPlugin,
  Engine,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  Vector3,
} from "@babylonjs/core";
import Ammo from "ammojs-typed";

import { buildCar } from "../model/car/car";

export const createScene = async (engine: Engine) => {
  const scene: Scene = new Scene(engine);

  const gravityVector = new Vector3(0, -9.81, 0);
  const AmmoJS = await Ammo();
  scene.enablePhysics(gravityVector, new AmmoJSPlugin());

  const ground = MeshBuilder.CreateGround(
    "ground1",
    { width: 100, height: 100, subdivisions: 2 },
    scene
  );

  (() => {
    [
      {
        AmmoJS,
        isCurrentPlayer: true,
        scene,
        startingPos: { x: 0, y: 5, z: 0 },
      },
      // {
      //   AmmoJS,
      //   scene,
      //   startingPos: { x: 10, y: 5, z: 0 },
      // },
      // {
      //   AmmoJS,
      //   scene,
      //   startingPos: { x: -10, y: 5, z: 0 },
      // },
      // {
      //   AmmoJS,
      //   scene,
      //   startingPos: { x: 15, y: 5, z: 0 },
      // },
    ].map((car) => buildCar(car));
  })();

  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0.9 },
    scene
  );

  return scene;
};
