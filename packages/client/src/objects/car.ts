import { Axis, MeshBuilder, Quaternion } from "@babylonjs/core";

var actions = { accelerate: false, brake: false, right: false, left: false };

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
var wheelRadiusBack = 0.4;
var wheelWidthBack = 0.3;
var wheelHalfTrackBack = 1;
var wheelAxisHeightBack = 0.4;

var wheelAxisFrontPosition = 1.0;
var wheelHalfTrackFront = 1;
var wheelAxisHeightFront = 0.4;
var wheelRadiusFront = 0.4;
var wheelWidthFront = 0.3;

// var friction = 5;
var suspensionStiffness = 10;
var suspensionDamping = 0.3;
var suspensionCompression = 4.4;
var suspensionRestLength = 0.6;
var rollInfluence = 0.0;

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
    //e.preventDefault();
    //e.stopPropagation();

    //return false;
  }
}

function keydown(e: KeyboardEvent) {
  if (keysActions[e.code]) {
    actions[keysActions[e.code]] = true;
    //e.preventDefault();
    //e.stopPropagation();

    //return false;
  }
}

function createChassisMesh(w, l, h, scene) {
  const mesh = new MeshBuilder.CreateBox(
    "box",
    { width: w, depth: h, height: l },
    scene
  );
  mesh.rotationQuaternion = new Quaternion();

  return mesh;
}

function createWheelMesh(radius, width, scene) {
  //var mesh = new BABYLON.MeshBuilder.CreateBox("wheel", {width:.82, height:.82, depth:.82}, scene);
  var mesh = new MeshBuilder.CreateCylinder(
    "Wheel",
    { diameter: 1, height: 0.5, tessellation: 36 },
    scene
  );
  mesh.rotationQuaternion = new Quaternion();
  // mesh.material = blackMaterial;

  return mesh;
}

function addWheel(
  isFront,
  pos,
  radius,
  width,
  index,
  vehicle,
  scene,
  wheelDirectionCS0,
  wheelAxleCS,
  tuning,
  wheelMeshes
) {
  var wheelInfo = vehicle.addWheel(
    pos,
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
}

function createVehicle({ quat, Ammo, scene, startingPos: { x, y, z } }) {
  //Going Native
  var physicsWorld = scene.getPhysicsEngine().getPhysicsPlugin().world;
  const wheelMeshes = [];

  wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
  wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

  var geometry = new Ammo.btBoxShape(
    new Ammo.btVector3(
      chassisWidth * 0.5,
      chassisHeight * 0.5,
      chassisLength * 0.5
    )
  );

  var transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(x, y, z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  var motionState = new Ammo.btDefaultMotionState(transform);
  var localInertia = new Ammo.btVector3(0, 0, 0);
  geometry.calculateLocalInertia(massVehicle, localInertia);

  const chassisMesh = createChassisMesh(
    chassisWidth,
    chassisHeight,
    chassisLength,
    scene
  );

  var massOffset = new Ammo.btVector3(0, 0.4, 0);
  var transform2 = new Ammo.btTransform();
  transform2.setIdentity();
  transform2.setOrigin(massOffset);
  var compound = new Ammo.btCompoundShape();
  compound.addChildShape(transform2, geometry);

  var body = new Ammo.btRigidBody(
    new Ammo.btRigidBodyConstructionInfo(
      massVehicle,
      motionState,
      compound,
      localInertia
    )
  );
  body.setActivationState(4);

  physicsWorld.addRigidBody(body);

  var tuning = new Ammo.btVehicleTuning();
  var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
  const vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
  vehicle.setCoordinateSystem(0, 1, 2);
  physicsWorld.addAction(vehicle);

  vehicle.getChassisWorldTransform();

  console.log(
    new Ammo.btVector3(
      wheelHalfTrackFront,
      wheelAxisHeightFront,
      wheelAxisFrontPosition
    ),
    wheelHalfTrackFront,
    wheelAxisHeightFront,
    wheelAxisFrontPosition
  );

  addWheel(
    true,
    new Ammo.btVector3(
      wheelHalfTrackFront,
      wheelAxisHeightFront,
      wheelAxisFrontPosition
    ),
    wheelRadiusFront,
    wheelWidthFront,
    FRONT_LEFT,
    vehicle,
    scene,
    wheelDirectionCS0,
    wheelAxleCS,
    tuning,
    wheelMeshes
  );
  addWheel(
    true,
    new Ammo.btVector3(
      -wheelHalfTrackFront,
      wheelAxisHeightFront,
      wheelAxisFrontPosition
    ),
    wheelRadiusFront,
    wheelWidthFront,
    FRONT_RIGHT,
    vehicle,
    scene,
    wheelDirectionCS0,
    wheelAxleCS,
    tuning,
    wheelMeshes
  );
  addWheel(
    false,
    new Ammo.btVector3(
      -wheelHalfTrackBack,
      wheelAxisHeightBack,
      wheelAxisPositionBack
    ),
    wheelRadiusBack,
    wheelWidthBack,
    BACK_LEFT,
    vehicle,
    scene,
    wheelDirectionCS0,
    wheelAxleCS,
    tuning,
    wheelMeshes
  );
  addWheel(
    false,
    new Ammo.btVector3(
      wheelHalfTrackBack,
      wheelAxisHeightBack,
      wheelAxisPositionBack
    ),
    wheelRadiusBack,
    wheelWidthBack,
    BACK_RIGHT,
    vehicle,
    scene,
    wheelDirectionCS0,
    wheelAxleCS,
    tuning,
    wheelMeshes
  );

  return { vehicle, chassisMesh, wheelMeshes };
}

export const buildCar = ({ scene, AmmoJS, startingPos, isCurrentPlayer }) => {
  const { vehicle, chassisMesh, wheelMeshes } = createVehicle({
    quat: ZERO_QUATERNION,
    Ammo: AmmoJS,
    scene,
    startingPos,
    isCurrentPlayer,
  });

  scene.registerBeforeRender(function () {
    // var dt = engine.getDeltaTime().toFixed() / 1000;

    if (vehicle !== undefined) {
      var speed = vehicle.getCurrentSpeedKmHour();
      // var maxSteerVal = 0.2;
      breakingForce = 0;
      engineForce = 0;

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
