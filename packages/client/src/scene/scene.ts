import {
  ArcRotateCamera,
  CascadedShadowGenerator,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Quaternion,
  Scene,
  Vector3,
} from "@babylonjs/core";
import type { Socket } from "socket.io-client";
// import * as CANNON from "cannon-es";
// import CannonDebugger from "cannon-es-debugger-babylonjs";

import type { Mesh, ShadowGenerator } from "@babylonjs/core";
import type { PlayersMap } from "../main";
import type { ActionTypes } from "@neu5/types/src";
// import { UIPlayersIndicators } from "../ui";

// const speedometerEl = document.getElementById("speedometer") as HTMLElement;

let dataFromServer: null | Array<{
  vehicle: {
    body: { position: Vector3; quaternion: Quaternion };
    wheels: Array<{ position: Vector3; quaternion: Quaternion }>;
  };
}> = null;

let actions = {
  accelerate: false,
  brake: false,
  left: false,
  right: false,
};

let meshCounter: number = 0;

const getName = (name: string) => {
  meshCounter = meshCounter + 1;

  return `${name}_${meshCounter}`;
};

type Meshes = Array<Mesh>;

// const throttle = (func: Function, timeFrame: number = 0) => {
//   var lastTime = 0;
//   return function (...args: any) {
//     var now = Date.now();
//     if (now - lastTime >= timeFrame) {
//       func(...args);
//       lastTime = now;
//     }
//   };
// };

// const log = throttle((...args: Array<any>) => {
//   console.log(...args);
// }, 1000);

// const playersIndicatorsEl = document.getElementById(
//   "players-indicators"
// ) as HTMLElement;

// const createScene = async (engine: Engine) => {
//   const newScene: Scene = new Scene(engine);

//   // Setup world
//   const world = new CANNON.World();
//   world.gravity.set(0, -9.81, 0);

//   return { newScene, world };
// };

const keydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case "w":
    case "ArrowUp":
      actions.accelerate = true;
      break;

    case "s":
    case "ArrowDown":
      actions.brake = true;
      break;

    case "a":
    case "ArrowLeft":
      actions.left = true;
      break;

    case "d":
    case "ArrowRight":
      actions.right = true;
      break;
  }
};

const keyup = (event: KeyboardEvent) => {
  switch (event.key) {
    case "w":
    case "ArrowUp":
      actions.accelerate = false;
      break;

    case "s":
    case "ArrowDown":
      actions.brake = false;
      break;

    case "a":
    case "ArrowLeft":
      actions.left = false;
      break;

    case "d":
    case "ArrowRight":
      actions.right = false;
      break;
  }
};

const startRace = async ({
  canvas,
  playersMap,
  sendAction,
  socket,
  FPSEl,
}: {
  canvas: HTMLCanvasElement;
  FPSEl: HTMLElement;
  playersMap: PlayersMap;
  sendAction: Function;
  socket: Socket;
}) => {
  // ============
  // helper functions
  // ============
  async function initBabylonJS(engine: Engine) {
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      15,
      new Vector3(0, 0, 0)
    );
    camera.attachControl(canvas, true);

    new HemisphericLight("hemiLight", new Vector3(-1, 1, 0), scene);

    const light = new DirectionalLight("dir01", new Vector3(2, -8, 2), scene);
    light.intensity = 0.4;

    camera.maxZ = 100;

    const shadowGenerator = new CascadedShadowGenerator(1024, light);

    window.addEventListener("resize", () => {
      engine.resize();
    });

    return { scene, shadowGenerator };
  }

  function addPlane({
    name = "plane",
    meshes,
    scene,
  }: {
    name?: string;
    meshes: Meshes;
    scene: Scene;
  }) {
    // Graphics
    const plane = MeshBuilder.CreatePlane(
      getName(name),
      { width: 100, height: 100 },
      scene
    );
    plane.rotation = new Vector3(Math.PI / 2, 0, 0);
    plane.receiveShadows = true;

    meshes.push(plane);

    return plane;
  }

  function addBox({
    width,
    height,
    depth,
    name = "box",
    meshes,
    shadowGenerator,
  }: {
    width: number;
    height: number;
    depth: number;
    name?: string;
    meshes: Meshes;
    shadowGenerator: ShadowGenerator;
  }) {
    // Graphics
    const box = MeshBuilder.CreateBox(getName(name), {
      width,
      height,
      depth,
    });
    box.rotationQuaternion = box.rotationQuaternion || new Quaternion();
    shadowGenerator.addShadowCaster(box, true);
    meshes.push(box);

    return box;
  }

  function addSphere({
    diameter,
    name = "sphere",
    meshes,
    shadowGenerator,
  }: {
    name?: string;
    diameter: number;
    meshes: Meshes;
    shadowGenerator: ShadowGenerator;
  }) {
    // Graphics
    const sphere = MeshBuilder.CreateSphere(getName(name));
    sphere.scalingDeterminant = diameter * 2;
    sphere.rotationQuaternion = sphere.rotationQuaternion || new Quaternion();
    shadowGenerator.addShadowCaster(sphere, true);
    meshes.push(sphere);

    return sphere;
  }

  function addRigidVehicle({
    meshes,
    shadowGenerator,
  }: {
    meshes: Meshes;
    shadowGenerator: ShadowGenerator;
  }) {
    const carChassisSize = {
      width: 4,
      height: 0.5,
      depth: 2,
    };
    const carWheelSize = 0.5;

    const carBody = addBox({
      width: carChassisSize.width,
      height: carChassisSize.height,
      depth: carChassisSize.depth,
      meshes,
      shadowGenerator,
    });

    let wheels = [];

    // wheels
    for (let idx = 0; idx < 4; idx++) {
      wheels.push(
        addSphere({
          diameter: carWheelSize,
          meshes,
          shadowGenerator,
        })
      );
    }

    return {
      body: carBody,
      wheels,
    };
  }

  const engine = new Engine(canvas, true); // Generate the BABYLON 3D engine

  // To be kept in sync
  let meshes: Meshes = [];

  actions = {
    accelerate: false,
    brake: false,
    left: false,
    right: false,
  };

  const { scene, shadowGenerator } = await initBabylonJS(engine);

  addPlane({ meshes, scene });

  const rigidVehicle = addRigidVehicle({ meshes, shadowGenerator });

  if (playersMap.size) {
    playersMap.forEach((player: any) => {
      player.vehicle = rigidVehicle;
    });
  }

  engine.runRenderLoop(function () {
    playersMap.forEach((player) => {
      if (dataFromServer !== null) {
        const {
          vehicle: {
            body: { position, quaternion },
            wheels,
          },
        } = dataFromServer[0];

        player.vehicle?.body.position.set(position.x, position.y, position.z);
        player.vehicle?.body.rotationQuaternion.set(
          quaternion.x,
          quaternion.y,
          quaternion.z,
          quaternion.w
        );

        wheels.forEach((wheel, idx) => {
          player.vehicle?.wheels[idx].position.set(
            wheel.position.x,
            wheel.position.y,
            wheel.position.z
          );
          player.vehicle?.wheels[idx].rotationQuaternion.set(
            quaternion.x,
            quaternion.y,
            quaternion.z,
            quaternion.w
          );
        });
      }
    });

    scene.render();

    FPSEl.textContent = `${engine.getFps().toFixed()} fps`;
  });

  socket.on("server:action", (playersFromServer) => {
    dataFromServer = playersFromServer;
  });

  setInterval(() => {
    playersMap.forEach((player) => {
      if (player.isCurrentPlayer) {
        sendAction(
          Object.entries(actions)
            .filter(
              ([key, value]) => value === true // eslint-disable-line
            )
            .map(([name]) => name)
        );
      }
    });
  }, 50);
};

const touchStart = (ev: TouchEvent) => {
  const target = ev.target as HTMLElement | null;

  if (target === null) {
    return;
  }

  const type: string | undefined = target.dataset.type;

  if (type !== undefined && actions[type as keyof ActionTypes] !== undefined) {
    actions[type as keyof ActionTypes] = true;
  }
};

const touchEnd = (ev: TouchEvent) => {
  const target = ev.target as HTMLElement | null;

  if (target === null) {
    return;
  }

  const type: string | undefined = target.dataset.type;

  if (type !== undefined && actions[type as keyof ActionTypes] !== undefined) {
    actions[type as keyof ActionTypes] = false;
  }
};

const preventSelection = () => false;

const preventContextMenu = (ev: Event) => {
  ev.preventDefault();
};

window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);

const [...mobileControlsEls] = document.getElementsByClassName(
  "mobile-controls"
) as HTMLCollectionOf<HTMLElement>;

if (mobileControlsEls.length) {
  mobileControlsEls.forEach((el) => {
    el.addEventListener("touchstart", touchStart);
    el.addEventListener("touchend", touchEnd);
    el.addEventListener("contextmenu", preventContextMenu);
    el.addEventListener("selectionchange", preventSelection);
    el.addEventListener("selectstart", preventSelection);
  });
}

export { startRace };
