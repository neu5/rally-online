import { MeshBuilder, Quaternion, Scene } from "@babylonjs/core";

export const createChassisMesh = ({
  color,
  w,
  l,
  h,
  scene,
}: {
  color: string;
  w: number;
  l: number;
  h: number;
  scene: Scene;
}) => {
  // @ts-ignore
  const mesh = new MeshBuilder.CreateBox(
    "box",
    { width: w, depth: h, height: l },
    scene
  );
  mesh.rotationQuaternion = new Quaternion();
  mesh.material = scene.getMaterialByName(color);

  return mesh;
};
