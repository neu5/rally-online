import { MeshBuilder, Quaternion, Vector4 } from "@babylonjs/core";
import type Ammo from "ammojs-typed";
import type { Scene } from "@babylonjs/core";

// const friction = 5;
const suspensionStiffness = 10;
const suspensionDamping = 0.3;
const suspensionCompression = 4.4;
const suspensionRestLength = 0.6;
const rollInfluence = 0.0;

const faceUV = [
  new Vector4(0, 0, 1, 1),
  new Vector4(0, 0.5, 0, 0.5),
  new Vector4(0, 0, 1, 1),
];

const createWheelMesh = (scene: Scene) => {
  // @ts-ignore
  const mesh = new MeshBuilder.CreateCylinder(
    "Wheel",
    { diameter: 1, height: 0.5, tessellation: 18, faceUV },
    scene
  );
  mesh.rotationQuaternion = new Quaternion();

  mesh.material = scene.getMaterialByName("wheelMaterial");

  return mesh;
};

type Wheel = {
  isFront?: boolean;
  position: Ammo.btVector3;
  radius: number;
  index: number;
  vehicle: Ammo.btRaycastVehicle;
  scene: Scene;
  wheelDirectionCS0: Ammo.btVector3;
  wheelAxleCS: Ammo.btVector3;
  tuning: Ammo.btVehicleTuning;
  wheelMeshes: Array<Wheel>;
};
export const addWheel = ({
  isFront = true,
  position,
  radius,
  index,
  vehicle,
  scene,
  wheelDirectionCS0,
  wheelAxleCS,
  tuning,
  wheelMeshes,
}: Wheel) => {
  const wheelInfo = vehicle.addWheel(
    position,
    wheelDirectionCS0,
    wheelAxleCS,
    suspensionRestLength,
    radius,
    tuning,
    isFront
  );

  wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
  wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
  wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
  wheelInfo.set_m_maxSuspensionForce(600000);
  wheelInfo.set_m_frictionSlip(40);
  wheelInfo.set_m_rollInfluence(rollInfluence);

  wheelMeshes[index] = createWheelMesh(scene);
};
