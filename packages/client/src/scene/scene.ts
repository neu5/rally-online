import {
  AmmoJSPlugin,
  Axis,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  Vector3,
} from "@babylonjs/core";
import Ammo from "ammojs-typed";
import { ACCELERATE, BRAKE, LEFT, RIGHT } from "@neu5/types/src";

import type { Socket } from "socket.io-client";
import type { Engine } from "@babylonjs/core";
import type { ActionTypes, Actions, KeysActions } from "@neu5/types/src";

import type { PlayersMap } from "../main";
import { UIPlayersIndicators } from "../ui";

import { buildCar } from "../model/car/car";
import { addColors, addWheelMaterial } from "../utils";

const steeringIncrement = 0.01;
const steeringClamp = 0.2;
const maxEngineForce = 500;
const maxBreakingForce = 10;

const keysActions: KeysActions = {
  KeyW: ACCELERATE,
  KeyS: BRAKE,
  KeyA: LEFT,
  KeyD: RIGHT,
};

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

const keyup = (e: KeyboardEvent) => {
  if (keysActions[e.code as keyof KeysActions]) {
    actions[keysActions[e.code as keyof KeysActions] as keyof Actions] = false;
  }
};

const keydown = (e: KeyboardEvent) => {
  if (keysActions[e.code as keyof KeysActions]) {
    actions[keysActions[e.code as keyof KeysActions] as keyof Actions] = true;
  }
};

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

  const { AmmoJS, scene } = await createScene(engine);

  playersMap.forEach((player) => {
    if (player.vehicleTemplate) {
      player.car = buildCar({
        AmmoJS,
        color: player.vehicleTemplate.color,
        scene,
        startingPos: player.vehicleTemplate.startingPos,
        isCurrentPlayer: player.isCurrentPlayer,
      });
    }

    player.updateAction = (data: Actions) => {
      player.actionsFromServer = { ...data };

      if (player.UIindicator) {
        const indicatorEl = player.UIindicator.children[1];
        const action = Object.entries(data)
          .filter(([key, value]) => value) // eslint-disable-line
          .reduce((previousValue, [actionName]) => actionName, "");

        indicatorEl.textContent = action;
      }
    };
  });

  UIPlayersIndicators(playersIndicatorsEl, playersMap);

  let vehicleSteering = 0;
  // const maxSteerVal = 0.2;

  scene.registerBeforeRender(() => {
    playersMap.forEach(({ actionsFromServer, car, isCurrentPlayer }) => {
      if (
        !car?.vehicle ||
        !car.wheelMeshes ||
        !car.chassisMesh ||
        !actionsFromServer
      ) {
        return;
      }

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
      chassisMesh.rotationQuaternion?.set(q.x(), q.y(), q.z(), q.w());
      chassisMesh.rotate(Axis.X, Math.PI);
    });
    // const dt = engine.getDeltaTime().toFixed() / 1000;
    // if (vehicle !== undefined) {
    //   const speed = vehicle.getCurrentSpeedKmHour();
  });

  socket.on("server:action", (playersList) => {
    playersList.forEach((player: { id: string; actions: Actions }) => {
      const playerToUpdate = playersMap.get(player.id);

      if (playerToUpdate?.updateAction) {
        playerToUpdate.updateAction(player.actions);
      }
    });
  });

  return scene;
};

export { createScene, startRace };

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
