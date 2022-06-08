import { MeshBuilder, Quaternion, Scene } from "@babylonjs/core";
import Ammo from "ammojs-typed";

// const friction = 5;
const suspensionStiffness = 10;
const suspensionDamping = 0.3;
const suspensionCompression = 4.4;
const suspensionRestLength = 0.6;
const rollInfluence = 0.0;

function createWheelMesh(radius: number, width: number, scene: Scene) {
  //const mesh = new BABYLON.MeshBuilder.CreateBox("wheel", {width:.82, height:.82, depth:.82}, scene);
  const mesh = new MeshBuilder.CreateCylinder(
    "Wheel",
    { diameter: 1, height: 0.5, tessellation: 18 },
    scene
  );
  mesh.rotationQuaternion = new Quaternion();
  // mesh.material = blackMaterial;

  return mesh;
}

type Wheel = {
  isFront: boolean;
  position: Ammo.btVector3;
  radius: number;
  width: number;
  index: number;
  vehicle: Ammo.btRaycastVehicle;
  scene: Scene;
  wheelDirectionCS0: Ammo.btVector3;
  wheelAxleCS: Ammo.btVector3;
  tuning: Ammo.btVehicleTuning;
  wheelMeshes: Array<Wheel>;
};
export const addWheel = ({
  isFront,
  position,
  radius,
  width,
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

  wheelMeshes[index] = createWheelMesh(radius, width, scene);
};
