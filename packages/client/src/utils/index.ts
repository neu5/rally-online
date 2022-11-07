import {
  Color3,
  MeshBuilder,
  Quaternion,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

import type { Scene, ShadowGenerator } from "@babylonjs/core";
import type { GameQuaternion, Position } from "@neu5/types/src";

const COLOR_NAMES = {
  BLACK: "BlackMaterial",
  BLUE: "BlueMaterial",
  GREEN: "GreenMaterial",
  RED: "RedMaterial",
  YELLOW: "YellowMaterial",
} as const;

const colors: Array<{ name: string; color: Color3 }> = [
  {
    name: COLOR_NAMES.BLACK,
    color: new Color3(0, 0, 0),
  },
  {
    name: COLOR_NAMES.BLUE,
    color: new Color3(0, 1, 1),
  },
  {
    name: COLOR_NAMES.GREEN,
    color: new Color3(0, 1, 0),
  },
  {
    name: COLOR_NAMES.RED,
    color: new Color3(1, 0, 0),
  },
  {
    name: COLOR_NAMES.YELLOW,
    color: new Color3(1, 1, 0),
  },
];

const addColors = (scene: Scene) => {
  colors.forEach(({ name, color }) => {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;
    material.emissiveColor = color;
  });
};

let meshCounter: number = 0;

const getName = (name: string) => {
  meshCounter = meshCounter + 1;

  return `${name}_${meshCounter}`;
};

const addPlane = ({
  name = "plane",
  width = 100,
  height = 100,
  scene,
}: {
  name?: string;
  width?: number;
  height?: number;
  scene: Scene;
}) => {
  // Graphics
  const plane = MeshBuilder.CreatePlane(
    getName(name),
    {
      width,
      height,
    },
    scene
  );
  plane.rotation = new Vector3(Math.PI / 2, 0, 0);
  plane.receiveShadows = true;

  return plane;
};

const addBox = ({
  width,
  height,
  depth,
  position,
  quaternion,
  isWall,
  name = "box",
  shadowGenerator,
}: {
  width: number;
  height: number;
  depth: number;
  position?: Position;
  quaternion?: GameQuaternion;
  isWall?: boolean;
  name?: string;
  shadowGenerator: ShadowGenerator;
}) => {
  // Graphics
  const box = MeshBuilder.CreateBox(getName(name), {
    width,
    height,
    depth,
  });
  box.rotationQuaternion = box.rotationQuaternion || new Quaternion();

  if (position) {
    box.position.set(position.x, position.y, position.z);
  }

  if (quaternion) {
    box.rotationQuaternion = new Quaternion(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );
  }

  if (isWall) {
    box.isVisible = false;
  } else {
    shadowGenerator.addShadowCaster(box, true);
  }

  return box;
};

const addSphere = ({
  diameter,
  name = "sphere",
  shadowGenerator,
}: {
  name?: string;
  diameter: number;
  shadowGenerator: ShadowGenerator;
}) => {
  // Graphics
  const sphere = MeshBuilder.CreateSphere(getName(name));
  sphere.scalingDeterminant = diameter * 2;
  sphere.rotationQuaternion = sphere.rotationQuaternion || new Quaternion();
  shadowGenerator.addShadowCaster(sphere, true);

  return sphere;
};

const addRigidVehicle = ({
  colorName,
  scene,
  shadowGenerator,
}: {
  colorName: string;
  scene: Scene;
  shadowGenerator: ShadowGenerator;
}) => {
  const carChassisSize = {
    width: 4,
    height: 0.5,
    depth: 2,
  };
  const carWheelSize = 0.5;

  const carBody = addBox({
    width: carChassisSize.width,
    height: carChassisSize.height,
    depth: carChassisSize.depth,
    shadowGenerator,
  });

  carBody.material = scene.getMaterialByName(colorName);

  let wheels = [];

  // wheels
  for (let idx = 0; idx < 4; idx++) {
    const wheel = addSphere({
      diameter: carWheelSize,
      shadowGenerator,
    });
    wheel.material = scene.getMaterialByName(COLOR_NAMES.BLACK);
    wheels.push(wheel);
  }

  return {
    body: carBody,
    wheels,
  };
};

export { addBox, addColors, addPlane, addSphere, addRigidVehicle };
