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
import CannonDebugger from "cannon-es-debugger";
import type { Socket } from "socket.io-client";

import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { PlayersMap } from "../main";
import type { Player } from "~/../types/src";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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

const startRace = async ({
  camera,
  controls,
  playersMap,
  renderer,
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
  let physicsWorld, cannonDebugger;

  // if (isDebugMode) {
  // physics engine part
  const axesHelper = new AxesHelper(100);
  scene.add(axesHelper);
  physicsWorld = new World({
    gravity: new Vec3(0, -9.82, 0),
  });
  // Create a static plane for the ground
  const groundBody = new Body({
    type: Body.STATIC, // can also be achieved by setting the mass to 0
    shape: new Plane(),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
  physicsWorld.addBody(groundBody);
  cannonDebugger = new CannonDebugger(scene, physicsWorld, {
    color: 0x00ff00,
  });

  // car
  const carBody = new Body({
    mass: 5,
    position: new Vec3(0, 6, 0),
    shape: new Box(
      new Vec3(
        carChassisSize.width,
        carChassisSize.height,
        carChassisSize.depth
      )
    ),
  });

  const vehicle = new RigidVehicle({
    chassisBody: carBody,
  });

  // wheels
  const mass = 1;
  const axisWidth = 5;
  const wheelShape = new Sphere(carWheelSize);
  const wheelMaterial = new Material("wheel");
  const down = new Vec3(0, -1, 0);

  const wheelBody1 = new Body({ mass, material: wheelMaterial });
  wheelBody1.addShape(wheelShape);
  wheelBody1.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody1,
    position: new Vec3(-1, 0, axisWidth / 4),
    axis: new Vec3(0, 0, 1),
    direction: down,
  });

  const wheelBody2 = new Body({ mass, material: wheelMaterial });
  wheelBody2.addShape(wheelShape);
  wheelBody2.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody2,
    position: new Vec3(-1, 0, -axisWidth / 4),
    axis: new Vec3(0, 0, 1),
    direction: down,
  });

  const wheelBody3 = new Body({ mass, material: wheelMaterial });
  wheelBody3.addShape(wheelShape);
  wheelBody3.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody3,
    position: new Vec3(1, 0, axisWidth / 4),
    axis: new Vec3(0, 0, 1),
    direction: down,
  });

  const wheelBody4 = new Body({ mass, material: wheelMaterial });
  wheelBody4.addShape(wheelShape);
  wheelBody4.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody4,
    position: new Vec3(1, 0, -axisWidth / 4),
    axis: new Vec3(0, 0, 1),
    direction: down,
  });

  vehicle.addToWorld(physicsWorld);

  addListeners(vehicle);

  // sphere
  // const radius = 1; // m
  // const sphereBody = new Body({
  //   mass: 5, // kg
  //   shape: new Sphere(radius),
  // });
  // sphereBody.position.set(0, 10, 0); // m
  // physicsWorld.addBody(sphereBody);
  // }

  // rendering engine part
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

  // const geometry = new SphereGeometry(1);
  // const material = new MeshBasicMaterial();
  // const sphere = new Mesh(geometry, material);
  // scene.add(sphere);

  camera.position.z = 20;

  function animate() {
    if (isDebugMode) {
      physicsWorld.fixedStep();
      cannonDebugger.update();
    }

    controls.update();

    boxMesh.position.copy(carBody.position);
    boxMesh.quaternion.copy(carBody.quaternion);
    sphereMesh1.position.copy(wheelBody1.position);
    sphereMesh1.quaternion.copy(wheelBody1.quaternion);
    sphereMesh2.position.copy(wheelBody2.position);
    sphereMesh2.quaternion.copy(wheelBody2.quaternion);
    sphereMesh3.position.copy(wheelBody3.position);
    sphereMesh3.quaternion.copy(wheelBody3.quaternion);
    sphereMesh4.position.copy(wheelBody4.position);
    sphereMesh4.quaternion.copy(wheelBody4.quaternion);

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  socket.on("server:action", (playersFromServer) => {
    // playersFromServer.forEach((player: Player) => {
    //   sphere.position.set(
    //     player.spherePos.x,
    //     player.spherePos.y,
    //     player.spherePos.z
    //   );
    // });
  });

  return scene;
};

const addListeners = (vehicle) => {
  document.addEventListener("keydown", (event) => {
    const maxSteerVal = Math.PI / 8;
    const maxForce = 20;

    switch (event.key) {
      case "w":
      case "ArrowUp":
        vehicle.setWheelForce(maxForce, 0);
        vehicle.setWheelForce(maxForce, 1);
        break;

      case "s":
      case "ArrowDown":
        vehicle.setWheelForce(-maxForce / 2, 0);
        vehicle.setWheelForce(-maxForce / 2, 1);
        break;

      case "a":
      case "ArrowLeft":
        vehicle.setSteeringValue(maxSteerVal, 0);
        vehicle.setSteeringValue(maxSteerVal, 1);
        break;

      case "d":
      case "ArrowRight":
        vehicle.setSteeringValue(-maxSteerVal, 0);
        vehicle.setSteeringValue(-maxSteerVal, 1);
        break;
    }
  });

  // reset car force to zero when key is released
  document.addEventListener("keyup", (event) => {
    switch (event.key) {
      case "w":
      case "ArrowUp":
        vehicle.setWheelForce(0, 0);
        vehicle.setWheelForce(0, 1);
        break;

      case "s":
      case "ArrowDown":
        vehicle.setWheelForce(0, 0);
        vehicle.setWheelForce(0, 1);
        break;

      case "a":
      case "ArrowLeft":
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
        break;

      case "d":
      case "ArrowRight":
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
        break;
    }
  });
};

export { startRace };
