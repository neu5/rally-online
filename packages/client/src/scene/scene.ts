import {
  CannonJSPlugin,
  MeshBuilder,
  PhysicsImpostor,
  Quaternion,
  Scene,
  Vector3,
} from "@babylonjs/core";
import type { Socket } from "socket.io-client";
import * as CANNON from "cannon-es";

import type { PlayersMap } from "../main";
import type { Engine } from "@babylonjs/core";
import type { ActionTypes } from "@neu5/types/src";
import { UIPlayersIndicators } from "../ui";

// const speedometerEl = document.getElementById("speedometer") as HTMLElement;

type Vector = {
  x: number;
  y: number;
  z: number;
};

const carChassisSize = {
  width: 2,
  height: 0.25,
  depth: 1,
};
const carWheelSize = 0.5;

let actions = {
  accelerate: false,
  brake: false,
  left: false,
  right: false,
};

let bodies = [];
let meshes = [];

const addPlane = ({ world }: { world: CANNON.World }) => {
  // Physics
  const shape = new CANNON.Plane();
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(shape);
  body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(body);
  bodies.push(body);

  // Graphics
  const plane = MeshBuilder.CreatePlane("plane", {
    width: 10,
    height: 10,
  });
  plane.rotation = new Vector3(Math.PI / 2, 0, 0);
  plane.receiveShadows = true;
  meshes.push(plane);
};

const addBox = ({
  width,
  height,
  depth,
  position,
  mass,
  world,
}: {
  width: number;
  height: number;
  depth: number;
  position: Vector;
  mass: number;
  world: CANNON.World;
}) => {
  // Physics
  const halfExtents = new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5);
  const shape = new CANNON.Box(halfExtents);
  const body = new CANNON.Body({ mass });
  body.addShape(shape);
  body.position.set(position.x, position.y, position.z);
  world.addBody(body);
  bodies.push(body);

  // Graphics
  const box = MeshBuilder.CreateBox("box", { width, height, depth });
  box.rotationQuaternion = box.rotationQuaternion || new Quaternion();
  meshes.push(box);

  return body;
};

const addSphere = ({
  mass,
  wheelMaterial = undefined,
  position,
  radius,
  world,
}: {
  mass: number;
  wheelMaterial?: CANNON.Material;
  position: CANNON.Vec3;
  radius: number;
  world: CANNON.World;
}) => {
  // Physics
  const body = new CANNON.Body({
    mass,
    position,
    ...(wheelMaterial ? { wheelMaterial } : {}),
  });
  const shape = new CANNON.Sphere(radius);
  body.addShape(shape);
  body.position.set(position.x, position.y, position.z);
  world.addBody(body);
  bodies.push(body);

  // Graphics
  const sphere = MeshBuilder.CreateSphere("sphere");
  sphere.scalingDeterminant = radius * 2;
  sphere.rotationQuaternion = sphere.rotationQuaternion || new Quaternion();
  // shadowGenerator.addShadowCaster(sphere, true)
  // sphere.receiveShadow = true
  meshes.push(sphere);

  return body;
};

const addRigidVehicle = ({
  position,
  world,
}: {
  position: Vector;
  world: CANNON.World;
}) => {
  const carBody = addBox({
    mass: 5,
    position,
    width: carChassisSize.width,
    height: carChassisSize.height,
    depth: carChassisSize.depth,
    world,
  });

  // because of some reason it looks like it's upside down
  // carBody.quaternion.setFromEuler(-Math.PI, 0, 0);

  const vehicle = new CANNON.RigidVehicle({
    chassisBody: carBody,
  });

  // wheels
  const wheelMass = 1;
  const axisWidth = carChassisSize.width;
  const wheelMaterial = new CANNON.Material("wheel");
  const down = new CANNON.Vec3(0, -1, 0);

  const wheelBody1 = addSphere({
    mass: wheelMass,
    wheelMaterial,
    position: new CANNON.Vec3(),
    radius: carWheelSize,
    world,
  });
  wheelBody1.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody1,
    position: new CANNON.Vec3(-1, 0.3, axisWidth / 6),
    axis: new CANNON.Vec3(0, 0, 1),
    direction: down,
  });

  const wheelBody2 = addSphere({
    mass: wheelMass,
    wheelMaterial,
    position: new CANNON.Vec3(),
    radius: carWheelSize,
    world,
  });
  wheelBody2.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody2,
    position: new CANNON.Vec3(-1, 0.3, -axisWidth / 6),
    axis: new CANNON.Vec3(0, 0, 1),
    direction: down,
  });

  const wheelBody3 = addSphere({
    mass: wheelMass,
    wheelMaterial,
    position: new CANNON.Vec3(),
    radius: carWheelSize,
    world,
  });
  wheelBody3.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody3,
    position: new CANNON.Vec3(1, 0.3, axisWidth / 6),
    axis: new CANNON.Vec3(0, 0, 1),
    direction: down,
  });

  const wheelBody4 = addSphere({
    mass: wheelMass,
    wheelMaterial,
    position: new CANNON.Vec3(),
    radius: carWheelSize,
    world,
  });
  wheelBody4.angularDamping = 0.4;
  vehicle.addWheel({
    body: wheelBody4,
    position: new CANNON.Vec3(1, 0.3, -axisWidth / 6),
    axis: new CANNON.Vec3(0, 0, 1),
    direction: down,
  });

  vehicle.addToWorld(world);

  return vehicle;
};

const playersIndicatorsEl = document.getElementById(
  "players-indicators"
) as HTMLElement;

const createScene = async (engine: Engine) => {
  const newScene: Scene = new Scene(engine);

  // Setup world
  const world = new CANNON.World();
  world.gravity.set(0, -9.81, 0);

  return { newScene, world };
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
  engine,
  oldScene,
  // playersMap,
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

  const { newScene, world } = await createScene(engine);

  addPlane({ world });

  const vehicle = addRigidVehicle({ position: { x: 0, y: 5, z: 0 }, world });

  // socket.on("server:action", (playersFromServer) => {});

  return { newScene, bodies, meshes, world };
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
