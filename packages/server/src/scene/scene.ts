import {
  AmmoJSPlugin,
  Axis,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  Vector3,
} from "@babylonjs/core";
import Ammo from "ammojs-typed";

import { buildCar } from "../model/car/car";

import type { Engine } from "@babylonjs/core";
import type { PlayersMap } from "../index";

// @todo: Create package with shared code #77
const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

const steeringIncrement = 0.01;
const steeringClamp = 0.2;
const maxEngineForce = 500;
const maxBreakingForce = 10;

const FRONT_LEFT = 0;
const FRONT_RIGHT = 1;
const BACK_LEFT = 2;
const BACK_RIGHT = 3;

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
  playersMap,
}: {
  engine: Engine;
  oldScene: Scene;
  playersMap: PlayersMap;
}) => {
  oldScene.dispose();
  engine.stopRenderLoop();

  const { AmmoJS, scene } = await createScene(engine);

  playersMap.forEach((player) => {
    if (player.vehicleTemplate) {
      player.car = buildCar({
        AmmoJS,
        color: player.vehicleTemplate.color,
        scene,
        startingPos: player.vehicleTemplate.startingPos,
      });
    }
  });

  // const maxSteerVal = 0.2;

  scene.registerBeforeRender(() => {
    playersMap.forEach((player) => {
      const { actions, car } = player;
      if (!car?.vehicle || !car.wheelMeshes || !car.chassisMesh || !actions) {
        return;
      }
      const { vehicle, wheelMeshes, chassisMesh } = car;
      const speed = vehicle.getCurrentSpeedKmHour();
      let breakingForce = 0;
      let engineForce = 0;
      if (actions[ACCELERATE]) {
        if (speed < -1) {
          breakingForce = maxBreakingForce;
        } else {
          engineForce = maxEngineForce;
        }
      } else if (actions[BRAKE]) {
        if (speed > 1) {
          breakingForce = maxBreakingForce;
        } else {
          engineForce = -maxEngineForce;
        }
      }
      if (actions[RIGHT]) {
        if (player.vehicleSteering < steeringClamp) {
          player.vehicleSteering += steeringIncrement;
        }
      } else if (actions[LEFT]) {
        if (player.vehicleSteering > -steeringClamp) {
          player.vehicleSteering -= steeringIncrement;
        }
      } else {
        player.vehicleSteering = 0;
      }
      vehicle.applyEngineForce(engineForce, FRONT_LEFT);
      vehicle.applyEngineForce(engineForce, FRONT_RIGHT);
      vehicle.setBrake(breakingForce / 2, FRONT_LEFT);
      vehicle.setBrake(breakingForce / 2, FRONT_RIGHT);
      vehicle.setBrake(breakingForce, BACK_LEFT);
      vehicle.setBrake(breakingForce, BACK_RIGHT);
      vehicle.setSteeringValue(player.vehicleSteering, FRONT_LEFT);
      vehicle.setSteeringValue(player.vehicleSteering, FRONT_RIGHT);
      let tm, p, q, i;
      const n = vehicle.getNumWheels();
      for (i = 0; i < n; i++) {
        vehicle.updateWheelTransform(i, true);
        tm = vehicle.getWheelTransformWS(i);
        p = tm.getOrigin();
        q = tm.getRotation();
        wheelMeshes[i].position.set(p.x(), p.y(), p.z());
        wheelMeshes[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
        wheelMeshes[i].rotate(Axis.Z, Math.PI / 2);
      }
      tm = vehicle.getChassisWorldTransform();
      p = tm.getOrigin();
      q = tm.getRotation();
      chassisMesh.position.set(p.x(), p.y(), p.z());
      chassisMesh.rotationQuaternion?.set(q.x(), q.y(), q.z(), q.w());
      chassisMesh.rotate(Axis.X, Math.PI);
    });
  });

  return scene;
};

export { startRace };
