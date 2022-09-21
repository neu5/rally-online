import {
  AxesHelper,
  BoxGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  PlaneGeometry,
  SphereGeometry,
} from "three";
// import {
//   Body,
//   Box,
//   Material,
//   Plane,
//   RigidVehicle,
//   Sphere,
//   Vec3,
//   World,
// } from "cannon-es";
// import CannonDebugger from "cannon-es-debugger";
import type { Socket } from "socket.io-client";

import type { PlayersMap } from "../main";
import type {
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import type { ActionTypes } from "@neu5/types/src";
// import { UIPlayersIndicators } from "../ui";

// const speedometerEl = document.getElementById("speedometer") as HTMLElement;

// const playersIndicatorsEl = document.getElementById(
//   "players-indicators"
// ) as HTMLElement;

const carChassisSize = {
  width: 2,
  height: 0.25,
  depth: 1,
};
const carWheelSize = 0.5;

let dataFromServer: null | Array<{
  vehicle: {
    chassis: { position: Vector3; quaternion: Quaternion };
    wheels: Array<{ position: Vector3; quaternion: Quaternion }>;
  };
}> = null;

let actions = {
  accelerate: false,
  brake: false,
  left: false,
  right: false,
};

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
  camera,
  controls,
  playersMap,
  renderer,
  sendAction,
  scene,
  socket,
}: {
  camera: PerspectiveCamera;
  controls: OrbitControls;
  playersMap: PlayersMap;
  renderer: WebGLRenderer;
  scene: Scene;
  sendAction: Function;
  socket: Socket;
}) => {
  // oldScene.dispose();
  // engine.stopRenderLoop();
  socket.off("server:action");

  const isDebugMode = true;
  // let physicsWorld, cannonDebugger;

  // if (isDebugMode) {
  // ============
  // || physics engine part
  // ============

  // debugging helpers
  const axesHelper = new AxesHelper(100);
  scene.add(axesHelper);

  actions = {
    accelerate: false,
    brake: false,
    left: false,
    right: false,
  };

  // physics world
  // physicsWorld = new World({
  //   gravity: new Vec3(0, -9.82, 0),
  // });

  // // Create a static plane for the ground
  // const groundBody = new Body({
  //   type: Body.STATIC, // can also be achieved by setting the mass to 0
  //   shape: new Plane(),
  // });
  // groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
  // physicsWorld.addBody(groundBody);

  // cannonDebugger = new CannonDebugger(scene, physicsWorld, {
  //   color: 0x00ff00,
  // });

  // car
  // const carBody = new Body({
  //   mass: 5,
  //   position: new Vec3(0, 6, 0),
  //   shape: new Box(
  //     new Vec3(
  //       carChassisSize.width,
  //       carChassisSize.height,
  //       carChassisSize.depth
  //     )
  //   ),
  // });

  // const vehicle = new RigidVehicle({
  //   chassisBody: carBody,
  // });

  // wheels
  // const mass = 1;
  // const axisWidth = 5;
  // const wheelShape = new Sphere(carWheelSize);
  // const wheelMaterial = new Material("wheel");
  // const down = new Vec3(0, -1, 0);

  // const wheelBody1 = new Body({ mass, material: wheelMaterial });
  // wheelBody1.addShape(wheelShape);
  // wheelBody1.angularDamping = 0.4;
  // vehicle.addWheel({
  //   body: wheelBody1,
  //   position: new Vec3(-1, 0, axisWidth / 4),
  //   axis: new Vec3(0, 0, 1),
  //   direction: down,
  // });

  // const wheelBody2 = new Body({ mass, material: wheelMaterial });
  // wheelBody2.addShape(wheelShape);
  // wheelBody2.angularDamping = 0.4;
  // vehicle.addWheel({
  //   body: wheelBody2,
  //   position: new Vec3(-1, 0, -axisWidth / 4),
  //   axis: new Vec3(0, 0, 1),
  //   direction: down,
  // });

  // const wheelBody3 = new Body({ mass, material: wheelMaterial });
  // wheelBody3.addShape(wheelShape);
  // wheelBody3.angularDamping = 0.4;
  // vehicle.addWheel({
  //   body: wheelBody3,
  //   position: new Vec3(1, 0, axisWidth / 4),
  //   axis: new Vec3(0, 0, 1),
  //   direction: down,
  // });

  // const wheelBody4 = new Body({ mass, material: wheelMaterial });
  // wheelBody4.addShape(wheelShape);
  // wheelBody4.angularDamping = 0.4;
  // vehicle.addWheel({
  //   body: wheelBody4,
  //   position: new Vec3(1, 0, -axisWidth / 4),
  //   axis: new Vec3(0, 0, 1),
  //   direction: down,
  // });

  // vehicle.addToWorld(physicsWorld);

  // ============
  // || rendering engine part
  // ============
  const planeGeometry = new PlaneGeometry(100, 100, 8, 8);
  const planeMaterial = new MeshBasicMaterial({
    color: 0xaaaaaa,
    side: DoubleSide,
  });
  const planeMesh = new Mesh(planeGeometry, planeMaterial);
  planeMesh.rotateX(-Math.PI / 2);

  scene.add(planeMesh);

  const boxGeometry = new BoxGeometry(
    carChassisSize.width * 2,
    carChassisSize.height * 2,
    carChassisSize.depth * 2
  );
  const boxMaterial = new MeshNormalMaterial();
  const boxMesh = new Mesh(boxGeometry, boxMaterial);
  scene.add(boxMesh);

  const sphereGeometry1 = new SphereGeometry(carWheelSize);
  const sphereMaterial1 = new MeshNormalMaterial();
  const sphereMesh1 = new Mesh(sphereGeometry1, sphereMaterial1);
  scene.add(sphereMesh1);

  const sphereGeometry2 = new SphereGeometry(carWheelSize);
  const sphereMaterial2 = new MeshNormalMaterial();
  const sphereMesh2 = new Mesh(sphereGeometry2, sphereMaterial2);
  scene.add(sphereMesh2);

  const sphereGeometry3 = new SphereGeometry(carWheelSize);
  const sphereMaterial3 = new MeshNormalMaterial();
  const sphereMesh3 = new Mesh(sphereGeometry3, sphereMaterial3);
  scene.add(sphereMesh3);

  const sphereGeometry4 = new SphereGeometry(carWheelSize);
  const sphereMaterial4 = new MeshNormalMaterial();
  const sphereMesh4 = new Mesh(sphereGeometry4, sphereMaterial4);
  scene.add(sphereMesh4);

  const wheelsMeshes = [sphereMesh1, sphereMesh2, sphereMesh3, sphereMesh4];

  // const geometry = new SphereGeometry(1);
  // const material = new MeshBasicMaterial();
  // const sphere = new Mesh(geometry, material);
  // scene.add(sphere);

  camera.position.z = 20;

  function animate() {
    if (isDebugMode) {
      // physicsWorld.fixedStep();
      // cannonDebugger.update();
    }

    controls.update();

    if (dataFromServer !== null) {
      dataFromServer.forEach(({ vehicle }) => {
        boxMesh.position.copy(vehicle.chassis.position);
        boxMesh.quaternion.copy(vehicle.chassis.quaternion);

        wheelsMeshes.forEach((wheelMesh, idx) => {
          wheelMesh.position.copy(vehicle.wheels[idx].position);
          wheelMesh.quaternion.copy(vehicle.wheels[idx].quaternion);
        });
      });
    }

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

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

  return scene;
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
