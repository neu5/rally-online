import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  Vector3,
} from "@babylonjs/core";

import { buildCar } from "./objects/car";

// Side-effects only imports allowing the standard material to be used as default.
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Animations/animatable";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const engine = new Engine(canvas);

const createScene = () => {
  const scene = new Scene(engine);

  MeshBuilder.CreateGround(
    "ground1",
    { width: 10, height: 10, subdivisions: 2 },
    scene
  );

  const box = MeshBuilder.CreateBox("box1");
  box.setAbsolutePosition(new Vector3(1, 1, 1));

  const car = buildCar(scene);
  car.setAbsolutePosition(new Vector3(-1, 1, 1));
  car.rotate(new Vector3(-1, 0, 0), 1.5);

  return scene;
};

const scene = createScene();

const camera = new ArcRotateCamera(
  "camera",
  -Math.PI / 2,
  Math.PI / 3,
  14,
  new Vector3(0, 0, 0)
);

camera.attachControl(canvas, true);
const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);

// Default intensity is 1. Let's dim the light a small amount
light.intensity = 0.7;

engine.runRenderLoop(() => {
  scene.render();
});
