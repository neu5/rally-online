import {
  CascadedShadowGenerator,
  DirectionalLight,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
// import * as CANNON from "cannon-es";
// import CannonDebugger from "cannon-es-debugger-babylonjs";

import { addPlane, addRigidVehicle } from "../utils";

import type { Engine } from "@babylonjs/core";
import type { PlayersMap } from "../main";
import type { ActionTypes } from "@neu5/types/src";
// import { UIPlayersIndicators } from "../ui";

// const speedometerEl = document.getElementById("speedometer") as HTMLElement;

let actions = {
  accelerate: false,
  brake: false,
  left: false,
  right: false,
};

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

const createScene = async (engine: Engine) => {
  const scene: Scene = new Scene(engine);

  new HemisphericLight("hemiLight", new Vector3(-1, 1, 0), scene);

  const light = new DirectionalLight("dir01", new Vector3(2, -8, 2), scene);
  light.intensity = 0.4;

  const shadowGenerator = new CascadedShadowGenerator(1024, light);

  return { scene, shadowGenerator };
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
  playersMap,
  sendAction,
}: {
  engine: Engine;
  playersMap: PlayersMap;
  sendAction: Function;
}) => {
  actions = {
    accelerate: false,
    brake: false,
    left: false,
    right: false,
  };

  const { scene, shadowGenerator } = await createScene(engine);

  addPlane({ scene });

  const rigidVehicle = addRigidVehicle({ shadowGenerator });

  if (playersMap.size) {
    playersMap.forEach((player: any) => {
      player.vehicle = rigidVehicle;
    });
  }

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

  return { playersMap, scene };
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
