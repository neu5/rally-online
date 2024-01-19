import {
  CascadedShadowGenerator,
  DirectionalLight,
  HavokPlugin,
  HemisphericLight,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  Vector3,
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

import { addColors, addVehicle } from "../utils";

import type { Engine } from "@babylonjs/core";
import type { GameConfig, GameObject } from "@neu5/types/src";
import type { Player, PlayersMap } from "../main";
// import { UIPlayersIndicators } from "../ui";

// const speedometerEl = document.getElementById("speedometer") as HTMLElement;

const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

type ActionTypes = {
  [ACCELERATE]: "accelerate";
  [BRAKE]: "brake";
  [LEFT]: "left";
  [RIGHT]: "right";
};

let actions = {
  accelerate: false,
  brake: false,
  left: false,
  right: false,
};

// const playersIndicatorsEl = document.getElementById(
//   "players-indicators"
// ) as HTMLElement;

const groundSize = 100;
// let groundPhysicsMaterial = { friction: 0.2, restitution: 0.3 };

async function getInitializedHavok() {
  try {
    return await HavokPhysics();
  } catch (e) {
    return e;
  }
}

const createScene = async (engine: Engine) => {
  const scene: Scene = new Scene(engine);

  new HemisphericLight("hemiLight", new Vector3(-1, 1, 0), scene);

  const light = new DirectionalLight("dir01", new Vector3(2, -8, 2), scene);
  light.intensity = 0.4;

  const shadowGenerator = new CascadedShadowGenerator(1024, light);

  const havokInstance = await getInitializedHavok();

  const hk = new HavokPlugin(true, havokInstance);

  scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

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
  // gameConfig,
  gameObjects,
  playersMap,
  sendAction,
}: {
  engine: Engine;
  gameConfig: GameConfig;
  gameObjects: GameObject[];
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

  gameObjects.forEach((gameObject) => {
    addBox({ ...gameObject, shadowGenerator });
  });

  addColors(scene);
  // addPlane({ scene, width: gameConfig.width, height: gameConfig.height });

  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: groundSize, height: groundSize },
    scene
  );
  ground.receiveShadows = true;

  // eslint-disable-next-line
  const groundAggregate = new PhysicsAggregate(
    ground,
    PhysicsShapeType.BOX,
    { mass: 0 },
    scene
  );

  const sphere = MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 4, segments: 32 },
    scene
  );

  sphere.position.x = 20;
  sphere.position.y = 20;
  shadowGenerator.addShadowCaster(sphere, true);

  // eslint-disable-next-line
  const sphereAggregate = new PhysicsAggregate(
    sphere,
    PhysicsShapeType.SPHERE,
    { mass: 1, restitution: 0.75 },
    scene
  );

  if (playersMap.length) {
    playersMap.forEach((player: any) => {
      player.vehicle = addVehicle({
        colorName: player.color,
        scene,
        shadowGenerator,
      });
      // player.vehicle = addRigidVehicle({
      //   colorName: player.color,
      //   scene,
      //   shadowGenerator,
      // });
    });
  }

  setInterval(() => {
    playersMap.forEach((player: Player) => {
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
