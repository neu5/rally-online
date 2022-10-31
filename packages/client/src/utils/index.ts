import { MeshBuilder, Quaternion, Vector3 } from "@babylonjs/core";

import type { Scene, ShadowGenerator } from "@babylonjs/core";

let meshCounter: number = 0;

const getName = (name: string) => {
  meshCounter = meshCounter + 1;

  return `${name}_${meshCounter}`;
};

const addPlane = ({
  name = "plane",
  scene,
}: {
  name?: string;
  scene: Scene;
}) => {
  // Graphics
  const plane = MeshBuilder.CreatePlane(
    getName(name),
    { width: 100, height: 100 },
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
  name = "box",
  shadowGenerator,
}: {
  width: number;
  height: number;
  depth: number;
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
  shadowGenerator.addShadowCaster(box, true);

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
  shadowGenerator,
}: {
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

  let wheels = [];

  // wheels
  for (let idx = 0; idx < 4; idx++) {
    wheels.push(
      addSphere({
        diameter: carWheelSize,
        shadowGenerator,
      })
    );
  }

  return {
    body: carBody,
    wheels,
  };
};

export { addBox, addPlane, addSphere, addRigidVehicle };
