import {
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
} from "@babylonjs/core";

import type { GroundMesh } from "@babylonjs/core";
import type { Position } from "@neu5/types/src";
// import type { GameConfig, Position } from "@neu5/types/src";

const groundSize = 100;

const createGround = (scene: Scene) => {
  // Our built-in 'ground' shape.
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: groundSize, height: groundSize },
    scene
  );

  return ground;
};

const createSphere = ({
  ground,
  scene,
  startingPos,
}: {
  ground: GroundMesh;
  scene: Scene;
  startingPos: Position;
}) => {
  // Our built-in 'sphere' shape.
  const sphere = MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 2, segments: 32 },
    scene
  );

  sphere.position.set(startingPos.x, startingPos.y, startingPos.z);

  // Create a sphere shape and the associated body. Size will be determined automatically.
  const sphereAggregate = new PhysicsAggregate(
    sphere,
    PhysicsShapeType.SPHERE,
    { mass: 1, restitution: 0.75 },
    scene
  );

  // Create a static box shape.
  const groundAggregate = new PhysicsAggregate(
    ground,
    PhysicsShapeType.BOX,
    { mass: 0 },
    scene
  );

  return sphere;
};

export { createGround, createSphere };
