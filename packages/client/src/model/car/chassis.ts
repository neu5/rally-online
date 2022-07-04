import {
  Color3,
  MeshBuilder,
  Quaternion,
  Scene,
  StandardMaterial,
} from "@babylonjs/core";

export const createChassisMesh = (
  w: number,
  l: number,
  h: number,
  scene: Scene
) => {
  const blueMaterial = new StandardMaterial("BlueMaterial", scene);
  blueMaterial.diffuseColor = new Color3(0.3, 0.5, 0.8);
  blueMaterial.emissiveColor = new Color3(0.3, 0.5, 0.8);

  // @ts-ignore
  const mesh = new MeshBuilder.CreateBox(
    "box",
    { width: w, depth: h, height: l },
    scene
  );
  mesh.rotationQuaternion = new Quaternion();
  mesh.material = blueMaterial;

  return mesh;
};
