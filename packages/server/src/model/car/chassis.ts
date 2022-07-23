import { MeshBuilder, Quaternion, Scene } from "@babylonjs/core";

export const createChassisMesh = (
  w: number,
  l: number,
  h: number,
  scene: Scene
) => {
  // @ts-ignore
  const mesh = new MeshBuilder.CreateBox(
    "box",
    { width: w, depth: h, height: l },
    scene
  );
  mesh.rotationQuaternion = new Quaternion();

  return mesh;
};
