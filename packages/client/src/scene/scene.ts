import {
  ArcRotateCamera,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Quaternion,
  Scene,
  ShadowGenerator,
  Vector3,
} from "@babylonjs/core";
import type { Socket } from "socket.io-client";
import * as CANNON from "cannon-es";

import type { PlayersMap } from "../main";
import { Engine } from "@babylonjs/core";
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
  canvas,
}: {
  canvas: HTMLCanvasElement;
  oldScene: Scene;
  playersMap: PlayersMap;
  sendAction: Function;
  socket: Socket;
}) => {
  const engine = new Engine(canvas, true); // Generate the BABYLON 3D engine
  const shapeWorldPosition = new CANNON.Vec3();
  const shapeWorldQuaternion = new CANNON.Quaternion();

  // // three.js variables
  let camera, light, shadowGenerator;
  let material;

  // // cannon.js variables
  let world;
  const timeStep = 1 / 60;
  let lastCallTime;

  const carChassisSize = {
    width: 4,
    height: 0.5,
    depth: 2,
  };
  const carWheelSize = 0.5;

  // // To be kept in sync
  const meshes = [];
  const bodies = [];

  const scene = await initBabylonJS();

  initCannon();

  addPlane();
  addSphere({ mass: 1, position: { x: -0.5, y: 4, z: -1 }, radius: 1 });

  let rigidVehicle;

  rigidVehicle = addRigidVehicle({
    position: {
      x: 10,
      y: 6,
      z: 0,
    },
  });

  setTimeout(() => {
    addBox({
      width: 1,
      height: 1,
      depth: 1,
      position: { x: 2, y: 3, z: 0.5 },
      mass: 1,
    });
  }, 500);

  if (rigidVehicle) {
    addRigidListeners(rigidVehicle);
  }

  async function initBabylonJS() {
    // // Scene
    const scene = new Scene(engine);
    // Camera
    camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      15,
      new Vector3(0, 0, 0)
    );
    camera.attachControl(canvas, true);
    const hemilight = new HemisphericLight(
      "hemiLight",
      new Vector3(-1, 1, 0),
      scene
    );

    light = new DirectionalLight("dir01", new Vector3(2, -8, 2), scene);
    light.intensity = 0.4;

    // Shadow generator
    shadowGenerator = new ShadowGenerator(1024, light);

    window.addEventListener("resize", onWindowResize);

    return scene;
  }

  function onWindowResize() {
    engine.resize();
  }

  function initCannon() {
    // Setup world
    world = new CANNON.World();
    world.gravity.set(0, -9.81, 0);
  }

  function updateMeshPositions() {
    let meshIndex = 0;
    for (const body of world.bodies) {
      for (let i = 0; i !== body.shapes.length; i++) {
        const shape = body.shapes[i];
        const mesh = meshes[meshIndex];
        if (mesh && mesh !== "wheel") {
          // Get world position
          body.quaternion.vmult(body.shapeOffsets[i], shapeWorldPosition);
          body.position.vadd(shapeWorldPosition, shapeWorldPosition);
          // Get world quaternion
          body.quaternion.mult(body.shapeOrientations[i], shapeWorldQuaternion);
          mesh.position.set(
            shapeWorldPosition.x,
            shapeWorldPosition.y,
            shapeWorldPosition.z
          );

          if (mesh.rotationQuaternion) {
            mesh.rotationQuaternion.set(
              shapeWorldQuaternion.x,
              shapeWorldQuaternion.y,
              shapeWorldQuaternion.z,
              shapeWorldQuaternion.w
            );
          }
        }
        meshIndex++;
      }
    }
  }

  function addPlane() {
    // Physics
    const shape = new CANNON.Plane();
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(body);
    bodies.push(body);

    // Graphics
    const plane = MeshBuilder.CreatePlane(
      "plane",
      { width: 50, height: 50 },
      scene
    );
    plane.rotation = new Vector3(Math.PI / 2, 0, 0);
    plane.receiveShadows = true;
    meshes.push(plane);
  }
  function addBox({ width, height, depth, position, mass }) {
    const size = 1;

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
    shadowGenerator.addShadowCaster(box, true);
    box.receiveShadow = true;
    meshes.push(box);

    return body;
  }

  function addSphere({ mass, wheelMaterial = undefined, position, radius }) {
    // Physics
    const body = new CANNON.Body({ mass, position, wheelMaterial });
    const shape = new CANNON.Sphere(radius);
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    world.addBody(body);
    bodies.push(body);

    // Graphics
    const sphere = MeshBuilder.CreateSphere("sphere", { radius });
    sphere.scalingDeterminant = radius * 2;
    sphere.rotationQuaternion = sphere.rotationQuaternion || new Quaternion();
    shadowGenerator.addShadowCaster(sphere, true);
    sphere.receiveShadow = true;
    meshes.push(sphere);

    return body;
  }

  function addCylinder({
    isWheel = false,
    name = "cylinder",
    height = 1,
    position,
    radius = 1,
    radiusTop = 1,
    radiusBottom = 1,
    mass = 1,
    material,
    numSegments = 8,
  }) {
    // Physics
    const body = new CANNON.Body({ mass });
    const shape = new CANNON.Cylinder(
      radiusTop,
      radiusBottom,
      height,
      numSegments
    );
    const quaternion = isWheel
      ? new CANNON.Quaternion().setFromEuler(Math.PI / 2, 0, 0)
      : new CANNON.Quaternion();
    // const quaternion = new CANNON.Quaternion().setFromEuler(Math.PI / 2, 0, 0)
    // body.addShape(shape, new CANNON.Vec3(), quaternion)
    body.addShape(shape, new CANNON.Vec3(), quaternion);
    body.position.set(position.x, position.y, position.z);
    world.addBody(body);
    bodies.push(body);

    // Graphics
    const cylinder = MeshBuilder.CreateCylinder(
      name,
      {
        diameterTop: radiusTop * 2,
        diameterBottom: radiusBottom * 2,
        height,
        tessellation: 6,
      },
      scene
    );

    if (isWheel) {
      cylinder.material = wheelMat;
    }

    cylinder.quaternion = cylinder.quaternion || new Quaternion();
    cylinder.rotationQuaternion =
      cylinder.rotationQuaternion || new Quaternion();
    shadowGenerator.addShadowCaster(cylinder, true);

    cylinder.receiveShadows = true;
    meshes.push(cylinder);

    return { body, cylinder, shape };
  }

  function addWheel(options) {
    return addCylinder({ name: "wheel", isWheel: true, ...options });
  }

  function addRigidVehicle({ position }) {
    const carBody = addBox({
      mass: 5,
      position,
      width: carChassisSize.width,
      height: carChassisSize.height,
      depth: carChassisSize.depth,
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
      position: { x: 0, y: 0, z: 0 },
      radius: carWheelSize,
    });
    wheelBody1.angularDamping = 0.4;
    vehicle.addWheel({
      body: wheelBody1,
      position: new CANNON.Vec3(-1, -0.3, axisWidth / 6),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const wheelBody2 = addSphere({
      mass: wheelMass,
      wheelMaterial,
      position: { x: 0, y: 0, z: 0 },
      radius: carWheelSize,
    });
    wheelBody2.angularDamping = 0.4;
    vehicle.addWheel({
      body: wheelBody2,
      position: new CANNON.Vec3(-1, -0.3, -axisWidth / 6),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const wheelBody3 = addSphere({
      mass: wheelMass,
      wheelMaterial,
      position: { x: 0, y: 0, z: 0 },
      radius: carWheelSize,
    });
    wheelBody3.angularDamping = 0.4;
    vehicle.addWheel({
      body: wheelBody3,
      position: new CANNON.Vec3(1, -0.3, axisWidth / 6),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const wheelBody4 = addSphere({
      mass: wheelMass,
      wheelMaterial,
      position: { x: 0, y: 0, z: 0 },
      radius: carWheelSize,
    });
    wheelBody4.angularDamping = 0.4;
    vehicle.addWheel({
      body: wheelBody4,
      position: new CANNON.Vec3(1, -0.3, -axisWidth / 6),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    vehicle.addToWorld(world);

    return vehicle;
  }

  engine.runRenderLoop(function () {
    world.fixedStep();

    scene.render();

    // Update the visible meshes positions
    updateMeshPositions();
  });

  function addRigidListeners(vehicle) {
    document.addEventListener("keydown", (event) => {
      const maxSteerVal = Math.PI / 8;
      const maxForce = 10;

      switch (event.key) {
        case "w":
        case "ArrowUp":
          vehicle.setWheelForce(maxForce, 2);
          vehicle.setWheelForce(maxForce, 3);
          break;

        case "s":
        case "ArrowDown":
          vehicle.setWheelForce(-maxForce / 2, 2);
          vehicle.setWheelForce(-maxForce / 2, 3);
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
          vehicle.setWheelForce(0, 2);
          vehicle.setWheelForce(0, 3);
          break;

        case "s":
        case "ArrowDown":
          vehicle.setWheelForce(0, 2);
          vehicle.setWheelForce(0, 3);
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
  }
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
