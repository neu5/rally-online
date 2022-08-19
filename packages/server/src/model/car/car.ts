import { Quaternion } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";

// @ts-ignore
type AmmoType = Ammo;

import { createChassisMesh } from "./chassis";
import { addWheel } from "./wheel";

const ZERO_QUATERNION = new Quaternion();

const chassisWidth = 1.8;
const chassisHeight = 0.6;
const chassisLength = 4;
const massVehicle = 200;

const wheelAxisPositionBack = -1;
// const wheelRadiusBack = 0.4;
// const wheelWidthBack = 0.3;
const wheelHalfTrackBack = 1;
const wheelAxisHeightBack = 0.4;

const wheelAxisFrontPosition = 1.0;
const wheelHalfTrackFront = 1;
const wheelAxisHeightFront = 0.4;
const wheelRadiusFront = 0.4;
// const wheelWidthFront = 0.3;

// const incEngine = 10.0;

const FRONT_LEFT = 0;
const FRONT_RIGHT = 1;
const BACK_LEFT = 2;
const BACK_RIGHT = 3;

type Vehicle = {
  AmmoJS: AmmoType;
  color: string;
  quat: Quaternion;
  scene: Scene;
  startingPos: { x: number; y: number; z: number };
};
const createVehicle = ({
  AmmoJS,
  color,
  quat,
  scene,
  startingPos: { x, y, z },
}: Vehicle) => {
  const physicsEngine = scene.getPhysicsEngine();

  if (physicsEngine === null) {
    throw new Error("Physics Engine is null");
  }

  const physicsWorld = physicsEngine.getPhysicsPlugin().world;
  const wheelMeshes: Array<any> = [];

  const wheelDirectionCS0 = new AmmoJS.btVector3(0, -1, 0);
  const wheelAxleCS = new AmmoJS.btVector3(-1, 0, 0);

  const geometry = new AmmoJS.btBoxShape(
    new AmmoJS.btVector3(
      chassisWidth * 0.5,
      chassisHeight * 0.5,
      chassisLength * 0.5
    )
  );

  const transform = new AmmoJS.btTransform();
  transform.setIdentity();
  transform.setOrigin(new AmmoJS.btVector3(x, y, z));
  transform.setRotation(
    new AmmoJS.btQuaternion(quat.x, quat.y, quat.z, quat.w)
  );
  const motionState = new AmmoJS.btDefaultMotionState(transform);
  const localInertia = new AmmoJS.btVector3(0, 0, 0);
  geometry.calculateLocalInertia(massVehicle, localInertia);

  const chassisMesh = createChassisMesh({
    color,
    w: chassisWidth,
    l: chassisHeight,
    h: chassisLength,
    scene,
  });

  const massOffset = new AmmoJS.btVector3(0, 0.4, 0);
  const transform2 = new AmmoJS.btTransform();
  transform2.setIdentity();
  transform2.setOrigin(massOffset);
  const compound = new AmmoJS.btCompoundShape();
  compound.addChildShape(transform2, geometry);

  const body = new AmmoJS.btRigidBody(
    new AmmoJS.btRigidBodyConstructionInfo(
      massVehicle,
      motionState,
      compound,
      localInertia
    )
  );
  body.setActivationState(4);

  physicsWorld.addRigidBody(body);

  const tuning = new AmmoJS.btVehicleTuning();
  const rayCaster = new AmmoJS.btDefaultVehicleRaycaster(physicsWorld);
  const vehicle = new AmmoJS.btRaycastVehicle(tuning, body, rayCaster);
  vehicle.setCoordinateSystem(0, 1, 2);
  physicsWorld.addAction(vehicle);

  vehicle.getChassisWorldTransform();

  [
    {
      isFront: true,
      position: new AmmoJS.btVector3(
        wheelHalfTrackFront,
        wheelAxisHeightFront,
        wheelAxisFrontPosition
      ),
      index: FRONT_LEFT,
    },
    {
      isFront: true,
      position: new AmmoJS.btVector3(
        -wheelHalfTrackFront,
        wheelAxisHeightFront,
        wheelAxisFrontPosition
      ),
      index: FRONT_RIGHT,
    },
    {
      isFront: false,
      position: new AmmoJS.btVector3(
        -wheelHalfTrackBack,
        wheelAxisHeightBack,
        wheelAxisPositionBack
      ),
      index: BACK_LEFT,
    },
    {
      isFront: false,
      position: new AmmoJS.btVector3(
        wheelHalfTrackBack,
        wheelAxisHeightBack,
        wheelAxisPositionBack
      ),
      index: BACK_RIGHT,
    },
  ].forEach((wheel) =>
    addWheel({
      ...wheel,
      radius: wheelRadiusFront,
      vehicle,
      scene,
      wheelDirectionCS0,
      wheelAxleCS,
      tuning,
      wheelMeshes,
    })
  );

  return { vehicle, chassisMesh, wheelMeshes };
};

export type BuilderCar = {
  AmmoJS: AmmoType;
  color: string;
  isCurrentPlayer?: boolean;
  scene: Scene;
  startingPos: { x: number; y: number; z: number };
};

export const buildCar = ({ AmmoJS, color, scene, startingPos }: BuilderCar) => {
  const { vehicle, chassisMesh, wheelMeshes } = createVehicle({
    AmmoJS,
    color,
    quat: ZERO_QUATERNION,
    scene,
    startingPos,
  });

  return { vehicle, chassisMesh, wheelMeshes };
};
