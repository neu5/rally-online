import {
  Axis,
  CannonJSPlugin,
  MeshBuilder,
  PhysicsImpostor,
  Quaternion,
  Scene,
  Vector3,
  Vector4,
} from "@babylonjs/core";
import * as CANNON from "cannon-es";

import type { Socket } from "socket.io-client";
import type { Engine } from "@babylonjs/core";

import type { PlayersMap } from "../main";
import { UIPlayersIndicators } from "../ui";

const speedometerEl = document.getElementById("speedometer") as HTMLElement;

const chassisWidth = 1;
const chassisHeight = 0.5;
const chassisDepth = 2;
const massVehicle = 50;

const massWheel = 30;

const wheelAxisPositionBack = -1;
const wheelHalfTrackBack = 1;
const wheelAxisHeightBack = 0.4;

const wheelAxisFrontPosition = 1.0;
const wheelHalfTrackFront = 1;
const wheelAxisHeightFront = 0.4;

const FRONT_LEFT = 0;
const FRONT_RIGHT = 1;
const BACK_LEFT = 2;
const BACK_RIGHT = 3;

const createChassisMesh = ({
  depth,
  height,
  width,
  scene,
}: {
  depth: number;
  height: number;
  width: number;
  scene: Scene;
}) => {
  // @ts-ignore
  const mesh = new MeshBuilder.CreateBox(
    "Chassis",
    { width, depth, height },
    scene
  );
  mesh.rotationQuaternion = new Quaternion();

  return mesh;
};

const wheelUV = [
  new Vector4(0, 0, 1, 1),
  new Vector4(0, 0.5, 0, 0.5),
  new Vector4(0, 0, 1, 1),
];

const createWheelMesh = ({ scene }) => {
  // @ts-ignore
  const mesh = new MeshBuilder.CreateCylinder(
    "Wheel",
    { diameter: 0.5, height: 0.2, tessellation: 18, wheelUV },
    scene
  );
  mesh.rotationQuaternion = new Quaternion();

  // cylinder is oriented in XZ plane, we want our wheels to be oriented in XY plane
  mesh.rotate(Axis.Z, Math.PI / 2);
  //in order to prevent doing this tranformation every frame, we bake the transform into vertices
  mesh.bakeCurrentTransformIntoVertices();

  // mesh.material = scene.getMaterialByName("wheelMaterial");

  return mesh;
};

const createScene = async (engine: Engine) => {
  const scene: Scene = new Scene(engine);

  const gravityVector = new Vector3(0, -9.81, 0);
  const cannonPlugin = new CannonJSPlugin(true, 10, CANNON);
  scene.enablePhysics(gravityVector, cannonPlugin);

  const ground = MeshBuilder.CreateGround(
    "ground1",
    { width: 100, height: 100, subdivisions: 2 },
    scene
  );

  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0.9 },
    scene
  );

  return { scene };
};

const playersIndicatorsEl = document.getElementById(
  "players-indicators"
) as HTMLElement;

const startRace = async ({
  engine,
  oldScene,
  playersMap,
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

  const { scene } = await createScene(engine);

  const physicsEngine = scene.getPhysicsEngine();

  if (physicsEngine === null) {
    throw new Error("Physics Engine is null");
  }

  const physicsWorld = physicsEngine.getPhysicsPlugin().world;

  playersMap.forEach((player) => {
    // Build the car chassis
    // const chassisShape = new CANNON.Box(
    //   new CANNON.Vec3(chassisWidth, chassisDepth, chassisHeight)
    // );

    const carPosition = [0, 4, 0];

    // const chassisBody = new CANNON.Body({ mass: massVehicle });
    // chassisBody.addShape(chassisShape);
    // chassisBody.position.set(...carPosition);
    // chassisBody.angularVelocity.set(0, 0.5, 0);
    // demo.addVisual(chassisBody)

    const visualBody = createChassisMesh({
      depth: chassisDepth,
      width: chassisWidth,
      height: chassisHeight,
      scene,
    });

    visualBody.physicsImpostor = new PhysicsImpostor(
      visualBody,
      PhysicsImpostor.BoxImpostor,
      { mass: massVehicle, restitution: 0.2 },
      scene
    );

    visualBody.position.set(...carPosition);

    const wheelFR = createWheelMesh({ scene });
    wheelFR.parent = visualBody;
    wheelFR.position = new Vector3(0.5, -0.25, 0.6);

    const wheelFL = createWheelMesh({ scene });
    wheelFL.parent = visualBody;
    wheelFL.position = new Vector3(-0.5, -0.25, 0.6);

    const wheelBR = createWheelMesh({ scene });
    wheelBR.parent = visualBody;
    wheelBR.position = new Vector3(0.5, -0.25, -0.6);

    const wheelBL = createWheelMesh({ scene });
    wheelBL.parent = visualBody;
    wheelBL.position = new Vector3(-0.5, -0.25, -0.6);

    wheelFR.physicsImpostor = new PhysicsImpostor(
      wheelFR,
      PhysicsImpostor.SphereImpostor,
      { mass: massWheel, restitution: 0.9 },
      scene
    );

    wheelFL.physicsImpostor = new PhysicsImpostor(
      wheelFL,
      PhysicsImpostor.SphereImpostor,
      { mass: massWheel, restitution: 0.9 },
      scene
    );

    wheelBR.physicsImpostor = new PhysicsImpostor(
      wheelBR,
      PhysicsImpostor.SphereImpostor,
      { mass: massWheel, restitution: 0.9 },
      scene
    );

    wheelBL.physicsImpostor = new PhysicsImpostor(
      wheelBL,
      PhysicsImpostor.SphereImpostor,
      { mass: massWheel, restitution: 0.9 },
      scene
    );

    // Create the vehicle
    // const vehicle = new CANNON.RaycastVehicle({
    //   chassisBody,
    // });

    // const wheelOptions = {
    //   radius: 0.5,
    //   directionLocal: new CANNON.Vec3(0, -1, 0),
    //   suspensionStiffness: 30,
    //   suspensionRestLength: 0.3,
    //   frictionSlip: 1.4,
    //   dampingRelaxation: 2.3,
    //   isFrontWheel: true,
    //   dampingCompression: 4.4,
    //   maxSuspensionForce: 100000,
    //   rollInfluence: 0.01,
    //   axleLocal: new CANNON.Vec3(0, 0, 1),
    //   chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1),
    //   maxSuspensionTravel: 0.3,
    //   customSlidingRotationalSpeed: -30,
    //   useCustomSlidingRotationalSpeed: true,
    // };

    // wheelOptions.chassisConnectionPointLocal.set(-1, 0, 1);
    // vehicle.addWheel(wheelOptions);

    // wheelOptions.chassisConnectionPointLocal.set(-1, 0, -1);
    // vehicle.addWheel(wheelOptions);

    // wheelOptions.chassisConnectionPointLocal.set(1, 0, 1);
    // vehicle.addWheel(wheelOptions);

    // wheelOptions.chassisConnectionPointLocal.set(1, 0, -1);
    // vehicle.addWheel(wheelOptions);

    // const wheelBodies = [];
    // const wheelMaterial = new CANNON.Material("wheel");
    // vehicle.wheelInfos.forEach((wheel) => {
    //   const cylinderShape = new CANNON.Cylinder(
    //     wheel.radius,
    //     wheel.radius,
    //     wheel.radius / 2,
    //     20
    //   );
    //   const wheelBody = new CANNON.Body({
    //     mass: 0,
    //     material: wheelMaterial,
    //   });
    //   wheelBody.type = CANNON.Body.KINEMATIC;
    //   wheelBody.collisionFilterGroup = 0; // turn off collisions
    //   const quaternion = new CANNON.Quaternion().setFromEuler(
    //     -Math.PI / 2,
    //     0,
    //     0
    //   );
    //   wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);
    //   wheelBodies.push(wheelBody);

    //   console.log(wheelBody.position);

    //   const wheelMesh = createWheelMesh(scene);
    // });

    // player.car = vehicle;

    console.log(player);
  });

  scene.registerBeforeRender(() => {});

  physicsWorld.addEventListener("postStep", () => {});

  return scene;
};

export { startRace };
