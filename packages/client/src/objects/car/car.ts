import { Axis, Quaternion, Scene } from "@babylonjs/core";
import Ammo from "ammojs-typed";

// @ts-ignore
type AmmoType = Ammo;

import { createChassisMesh } from "./chassis";
import { addWheel } from "./wheel";

const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

type ActionTypes = {
  [ACCELERATE]: "accelerate";
  [BRAKE]: "brake";
  [LEFT]: "left";
  [RIGHT]: "right";
};

interface Actions {
  [ACCELERATE]: boolean;
  [BRAKE]: boolean;
  [LEFT]: boolean;
  [RIGHT]: boolean;
}
const actions: Actions = {
  [ACCELERATE]: false,
  [BRAKE]: false,
  [LEFT]: false,
  [RIGHT]: false,
};

interface KeysActions {
  KeyW: string;
  KeyS: string;
  KeyA: string;
  KeyD: string;
}

const keysActions: KeysActions = {
  KeyW: ACCELERATE,
  KeyS: BRAKE,
  KeyA: LEFT,
  KeyD: RIGHT,
};

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
const wheelWidthFront = 0.3;

const steeringIncrement = 0.01;
const steeringClamp = 0.2;
const maxEngineForce = 500;
const maxBreakingForce = 10;
// const incEngine = 10.0;

const FRONT_LEFT = 0;
const FRONT_RIGHT = 1;
const BACK_LEFT = 2;
const BACK_RIGHT = 3;

const keyup = (e: KeyboardEvent) => {
  if (keysActions[e.code as keyof KeysActions]) {
    actions[keysActions[e.code as keyof KeysActions] as keyof Actions] = false;
  }
};

const keydown = (e: KeyboardEvent) => {
  if (keysActions[e.code as keyof KeysActions]) {
    actions[keysActions[e.code as keyof KeysActions] as keyof Actions] = true;
  }
};

type Vehicle = {
  AmmoJS: AmmoType;
  quat: Quaternion;
  scene: Scene;
  startingPos: { x: number; y: number; z: number };
};
const createVehicle = ({
  AmmoJS,
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

  const chassisMesh = createChassisMesh(
    chassisWidth,
    chassisHeight,
    chassisLength,
    scene
  );

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
      width: wheelWidthFront,
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
  isCurrentPlayer?: boolean;
  scene: Scene;
  startingPos: { x: number; y: number; z: number };
};
export const buildCar = ({
  AmmoJS,
  scene,
  startingPos,
  isCurrentPlayer = false,
}: BuilderCar) => {
  const { vehicle, chassisMesh, wheelMeshes } = createVehicle({
    AmmoJS,
    quat: ZERO_QUATERNION,
    scene,
    startingPos,
  });

  let vehicleSteering = 0;

  scene.registerBeforeRender(function () {
    // const dt = engine.getDeltaTime().toFixed() / 1000;

    if (vehicle !== undefined) {
      const speed = vehicle.getCurrentSpeedKmHour();
      // const maxSteerVal = 0.2;
      let breakingForce = 0;
      let engineForce = 0;

      if (isCurrentPlayer) {
        if (actions.accelerate) {
          if (speed < -1) {
            breakingForce = maxBreakingForce;
          } else {
            engineForce = maxEngineForce;
          }
        } else if (actions.brake) {
          if (speed > 1) {
            breakingForce = maxBreakingForce;
          } else {
            engineForce = -maxEngineForce;
          }
        }

        if (actions.right) {
          if (vehicleSteering < steeringClamp) {
            vehicleSteering += steeringIncrement;
          }
        } else if (actions.left) {
          if (vehicleSteering > -steeringClamp) {
            vehicleSteering -= steeringIncrement;
          }
        } else {
          vehicleSteering = 0;
        }

        vehicle.applyEngineForce(engineForce, FRONT_LEFT);
        vehicle.applyEngineForce(engineForce, FRONT_RIGHT);

        vehicle.setBrake(breakingForce / 2, FRONT_LEFT);
        vehicle.setBrake(breakingForce / 2, FRONT_RIGHT);
        vehicle.setBrake(breakingForce, BACK_LEFT);
        vehicle.setBrake(breakingForce, BACK_RIGHT);

        vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT);
        vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT);
      }

      let tm, p, q, i;
      const n = vehicle.getNumWheels();
      for (i = 0; i < n; i++) {
        vehicle.updateWheelTransform(i, true);
        tm = vehicle.getWheelTransformWS(i);
        p = tm.getOrigin();
        q = tm.getRotation();
        wheelMeshes[i].position.set(p.x(), p.y(), p.z());
        wheelMeshes[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
        wheelMeshes[i].rotate(Axis.Z, Math.PI / 2);
      }

      tm = vehicle.getChassisWorldTransform();
      p = tm.getOrigin();
      q = tm.getRotation();
      chassisMesh.position.set(p.x(), p.y(), p.z());
      chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
      chassisMesh.rotate(Axis.X, Math.PI);
    }
  });

  return vehicle;
};

const touchStart = (ev: TouchEvent) => {
  const target = ev.target as HTMLElement | null;

  if (target === null) {
    return;
  }

  const type: string | undefined = target.dataset.type;

  if (type !== undefined && actions[type as keyof ActionTypes] !== undefined) {
    actions[type as keyof ActionTypes] = true;
  }
};

const touchEnd = (ev: TouchEvent) => {
  const target = ev.target as HTMLElement | null;

  if (target === null) {
    return;
  }

  const type: string | undefined = target.dataset.type;

  if (type !== undefined && actions[type as keyof ActionTypes] !== undefined) {
    actions[type as keyof ActionTypes] = false;
  }
};

const preventSelection = () => false;

const preventContextMenu = (ev: Event) => {
  ev.preventDefault();
};

window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);

const [...mobileControlsEls] = document.getElementsByClassName(
  "mobile-controls"
) as HTMLCollectionOf<HTMLElement>;

if (mobileControlsEls.length) {
  mobileControlsEls.forEach((el) => {
    el.addEventListener("touchstart", touchStart);
    el.addEventListener("touchend", touchEnd);
    el.addEventListener("selectstart", preventSelection);
    el.addEventListener("contextmenu", preventContextMenu);
  });
}
