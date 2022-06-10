import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Vector3,
} from "@babylonjs/core";

import { createScene } from "./scene/scene";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

(async () => {
  const engine: Engine = new Engine(canvas);
  const scene = await createScene(engine);

  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 3.5,
    130,
    Vector3.Zero()
  );

  camera.lowerBetaLimit = -Math.PI / 2;
  camera.upperBetaLimit = Math.PI / 2;

  camera.attachControl(canvas, true);
  const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });
})();
