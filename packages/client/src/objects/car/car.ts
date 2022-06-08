import { Axis, Quaternion, Scene } from "@babylonjs/core";
import Ammo from "ammojs-typed";

import { createChassisMesh } from "./chassis";
import { addWheel } from "./wheel";

type Actions = {
  accelerate: boolean;
  brake: boolean;
  right: boolean;
  left: boolean;
};
const actions: Actions = {
  accelerate: false,
  brake: false,
  right: false,
  left: false,
};

interface KeysActions {
  KeyW: string;
  KeyS: string;
  KeyA: string;
  KeyD: string;
}

const keysActions = {
  KeyW: "acceleration",
  KeyS: "braking",
  KeyA: "left",
  KeyD: "right",
};

var ZERO_QUATERNION = new Quaternion();

var chassisWidth = 1.8;
var chassisHeight = 0.6;
var chassisLength = 4;
var massVehicle = 200;

var wheelAxisPositionBack = -1;
// var wheelRadiusBack = 0.4;
// var wheelWidthBack = 0.3;
var wheelHalfTrackBack = 1;
var wheelAxisHeightBack = 0.4;

var wheelAxisFrontPosition = 1.0;
var wheelHalfTrackFront = 1;
var wheelAxisHeightFront = 0.4;
var wheelRadiusFront = 0.4;
var wheelWidthFront = 0.3;

var steeringIncrement = 0.01;
var steeringClamp = 0.2;
var maxEngineForce = 500;
var maxBreakingForce = 10;
// var incEngine = 10.0;

var FRONT_LEFT = 0;
var FRONT_RIGHT = 1;
var BACK_LEFT = 2;
var BACK_RIGHT = 3;

function keyup(e: KeyboardEvent) {
  if ((keysActions as KeysActions)[e.code]) {
    actions[keysActions[e.code]] = false;
  }
}

function keydown(e: KeyboardEvent) {
  if (keysActions[e.code]) {
    actions[keysActions[e.code]] = true;
  }
}

type Vehicle = {
  AmmoJS: Ammo;
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

  var geometry = new AmmoJS.btBoxShape(
    new AmmoJS.btVector3(
      chassisWidth * 0.5,
      chassisHeight * 0.5,
      chassisLength * 0.5
    )
  );

  var transform = new AmmoJS.btTransform();
  transform.setIdentity();
  transform.setOrigin(new AmmoJS.btVector3(x, y, z));
  transform.setRotation(
    new AmmoJS.btQuaternion(quat.x, quat.y, quat.z, quat.w)
  );
  var motionState = new AmmoJS.btDefaultMotionState(transform);
  var localInertia = new AmmoJS.btVector3(0, 0, 0);
  geometry.calculateLocalInertia(massVehicle, localInertia);

  const chassisMesh = createChassisMesh(
    chassisWidth,
    chassisHeight,
    chassisLength,
    scene
  );

  var massOffset = new AmmoJS.btVector3(0, 0.4, 0);
  var transform2 = new AmmoJS.btTransform();
  transform2.setIdentity();
  transform2.setOrigin(massOffset);
  var compound = new AmmoJS.btCompoundShape();
  compound.addChildShape(transform2, geometry);

  var body = new AmmoJS.btRigidBody(
    new AmmoJS.btRigidBodyConstructionInfo(
      massVehicle,
      motionState,
      compound,
      localInertia
    )
  );
  body.setActivationState(4);

  physicsWorld.addRigidBody(body);

  var tuning = new AmmoJS.btVehicleTuning();
  var rayCaster = new AmmoJS.btDefaultVehicleRaycaster(physicsWorld);
  const vehicle = new AmmoJS.btRaycastVehicle(tuning, body, rayCaster);
  vehicle.setCoordinateSystem(0, 1, 2);
  physicsWorld.addAction(vehicle);

  vehicle.getChassisWorldTransform();

  // const addWheel2 = ()

  addWheel({
    isFront: true,
    position: new AmmoJS.btVector3(
      wheelHalfTrackFront,
      wheelAxisHeightFront,
      wheelAxisFrontPosition
    ),
    radius: wheelRadiusFront,
    width: wheelWidthFront,
    index: FRONT_LEFT,
    vehicle,
    scene,
    wheelDirectionCS0,
    wheelAxleCS,
    tuning,
    wheelMeshes,
  });
  addWheel({
    isFront: true,
    position: new AmmoJS.btVector3(
      -wheelHalfTrackFront,
      wheelAxisHeightFront,
      wheelAxisFrontPosition
    ),
    radius: wheelRadiusFront,
    width: wheelWidthFront,
    index: FRONT_RIGHT,
    vehicle,
    scene,
    wheelDirectionCS0,
    wheelAxleCS,
    tuning,
    wheelMeshes,
  });
  addWheel({
    isFront: false,
    position: new AmmoJS.btVector3(
      -wheelHalfTrackBack,
      wheelAxisHeightBack,
      wheelAxisPositionBack
    ),
    radius: wheelRadiusFront,
    width: wheelWidthFront,
    index: BACK_LEFT,
    vehicle,
    scene,
    wheelDirectionCS0,
    wheelAxleCS,
    tuning,
    wheelMeshes,
  });
  addWheel({
    isFront: false,
    position: new AmmoJS.btVector3(
      wheelHalfTrackBack,
      wheelAxisHeightBack,
      wheelAxisPositionBack
    ),
    radius: wheelRadiusFront,
    width: wheelWidthFront,
    index: BACK_RIGHT,
    vehicle,
    scene,
    wheelDirectionCS0,
    wheelAxleCS,
    tuning,
    wheelMeshes,
  });

  return { vehicle, chassisMesh, wheelMeshes };
};

export type BuilderCar = {
  AmmoJS: Ammo;
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
    // var dt = engine.getDeltaTime().toFixed() / 1000;

    if (vehicle !== undefined) {
      var speed = vehicle.getCurrentSpeedKmHour();
      // var maxSteerVal = 0.2;
      let breakingForce = 0;
      let engineForce = 0;

      if (isCurrentPlayer) {
        if (actions.acceleration) {
          if (speed < -1) {
            breakingForce = maxBreakingForce;
          } else {
            engineForce = maxEngineForce;
          }
        } else if (actions.braking) {
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

      var tm, p, q, i;
      var n = vehicle.getNumWheels();
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

  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);

  return vehicle;
};
