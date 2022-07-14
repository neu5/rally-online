import {
  AmmoJSPlugin,
  Axis,
  Engine,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  Vector3,
} from "@babylonjs/core";
import Ammo from "ammojs-typed";
import { Socket } from "socket.io-client";

import { buildCar } from "../model/car/car";
import { addColors, addWheelMaterial } from "../utils";

const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

interface Actions {
  [ACCELERATE]: boolean;
  [BRAKE]: boolean;
  [LEFT]: boolean;
  [RIGHT]: boolean;
}

const steeringIncrement = 0.01;
const steeringClamp = 0.2;
const maxEngineForce = 500;
const maxBreakingForce = 10;

const actions: Actions = {
  [ACCELERATE]: false,
  [BRAKE]: false,
  [LEFT]: false,
  [RIGHT]: false,
};

const FRONT_LEFT = 0;
const FRONT_RIGHT = 1;
const BACK_LEFT = 2;
const BACK_RIGHT = 3;

let actionsFromServer: Actions = { ...actions };

const speedometerEl = document.getElementById("speedometer") as HTMLElement;

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

  addColors(scene);
  addWheelMaterial();

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
  sendAction,
  socket,
}: {
  engine: Engine;
  oldScene: Scene;
  playersMap: Map<
    string,
    {
      car?: {
        updateAction?: (actions: Actions) => void;
      };
      name: string;
      vehicle?: {
        color: string;
        startingPos: {
          x: number;
          y: number;
          z: number;
        };
      };
      isCurrentPlayer: boolean;
    }
  >;
  sendAction: Function;
  socket: Socket;
}) => {
  oldScene.dispose();
  engine.stopRenderLoop();
  socket.off("server:action");

  const { AmmoJS, scene } = await createScene(engine);

  playersMap.forEach((player) => {
    if (player.vehicle) {
      player.car = buildCar({
        AmmoJS,
        color: player.vehicle.color,
        scene,
        startingPos: player.vehicle.startingPos,
        isCurrentPlayer: player.isCurrentPlayer,
      });
    }
  });

  let vehicleSteering = 0;
  // const maxSteerVal = 0.2;

  // vehicle.updateAction = (data: Actions) => {
  //   actionsFromServer = { ...data };
  // };

  scene.registerBeforeRender(() => {
    playersMap.forEach(({ car, isCurrentPlayer }) => {
      const { vehicle, wheelMeshes, chassisMesh } = car;
      const speed = vehicle.getCurrentSpeedKmHour();

      let breakingForce = 0;
      let engineForce = 0;
      if (isCurrentPlayer) {
        if (actionsFromServer[ACCELERATE]) {
          if (speed < -1) {
            breakingForce = maxBreakingForce;
          } else {
            engineForce = maxEngineForce;
          }
        } else if (actionsFromServer[BRAKE]) {
          if (speed > 1) {
            breakingForce = maxBreakingForce;
          } else {
            engineForce = -maxEngineForce;
          }
        }
        if (actions[RIGHT]) {
          if (vehicleSteering < steeringClamp) {
            vehicleSteering += steeringIncrement;
          }
        } else if (actions[LEFT]) {
          if (vehicleSteering > -steeringClamp) {
            vehicleSteering -= steeringIncrement;
          }
        } else {
          vehicleSteering = 0;
        }
        const actionType = Object.entries(actions).find(
          ([key, value]) => value === true // eslint-disable-line
        );
        if (actionType && actionType[0]) {
          sendAction(actionType[0]);
        }
        vehicle.applyEngineForce(engineForce, FRONT_LEFT);
        vehicle.applyEngineForce(engineForce, FRONT_RIGHT);
        vehicle.setBrake(breakingForce / 2, FRONT_LEFT);
        vehicle.setBrake(breakingForce / 2, FRONT_RIGHT);
        vehicle.setBrake(breakingForce, BACK_LEFT);
        vehicle.setBrake(breakingForce, BACK_RIGHT);
        vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT);
        vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT);
        speedometerEl.textContent = `${vehicle
          .getCurrentSpeedKmHour()
          .toFixed()} km/h`;
      }
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
      chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
      chassisMesh.rotate(Axis.X, Math.PI);
    });
    // const dt = engine.getDeltaTime().toFixed() / 1000;
    // if (vehicle !== undefined) {
    //   const speed = vehicle.getCurrentSpeedKmHour();
  });

  // socket.on("server:action", (playersList) => {
  //   playersList.forEach((player: { id: string; actions: Actions }) => {
  //     const playerToUpdate = playersMap.get(player.id);

  //     if (playerToUpdate?.car?.updateAction) {
  //       playerToUpdate.car.updateAction(player.actions);
  //     }
  //   });
  // });

  return scene;
};

export { createScene, startRace };
