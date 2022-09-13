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

const createScene = async (engine: Engine) => {
  const scene: Scene = new Scene(engine);

  const gravityVector = new Vector3(0, -9.82, 0);
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

  const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 });

  socket.on("server:action", (playersFromServer) => {
    playersFromServer.forEach((player) => {
      sphere.position.set(
        player.spherePos.x,
        player.spherePos.y,
        player.spherePos.z
      );
    });
  });

  return scene;
};

export { startRace };
