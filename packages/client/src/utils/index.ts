import {
  Axis,
  Color3,
  MeshBuilder,
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeConvexHull,
  Quaternion,
  Space,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

import type {
  InstancedMesh,
  Mesh,
  Scene,
  ShadowGenerator,
} from "@babylonjs/core";
import type { GameQuaternion, Position } from "@neu5/types/src";

import { RaycastVehicle } from "./RaycastVehicle";
import { RaycastWheel } from "./RaycastWheel";

const COLOR_NAMES = {
  BLACK: "BlackMaterial",
  BLUE: "BlueMaterial",
  GREEN: "GreenMaterial",
  RED: "RedMaterial",
  YELLOW: "YellowMaterial",
} as const;

const colors: Array<{ name: string; color: Color3 }> = [
  {
    name: COLOR_NAMES.BLACK,
    color: new Color3(0, 0, 0),
  },
  {
    name: COLOR_NAMES.BLUE,
    color: new Color3(0, 1, 1),
  },
  {
    name: COLOR_NAMES.GREEN,
    color: new Color3(0, 1, 0),
  },
  {
    name: COLOR_NAMES.RED,
    color: new Color3(1, 0, 0),
  },
  {
    name: COLOR_NAMES.YELLOW,
    color: new Color3(1, 1, 0),
  },
];

const addColors = (scene: Scene) => {
  colors.forEach(({ name, color }) => {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;
    material.emissiveColor = color;
  });
};

let meshCounter: number = 0;

const getName = (name: string) => {
  meshCounter = meshCounter + 1;

  return `${name}_${meshCounter}`;
};

const addPlane = ({
  name = "plane",
  width = 100,
  height = 100,
  scene,
}: {
  name?: string;
  width?: number;
  height?: number;
  scene: Scene;
}) => {
  // Graphics
  const plane = MeshBuilder.CreatePlane(
    getName(name),
    {
      width,
      height,
    },
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
  position,
  quaternion,
  isWall,
  name = "box",
  shadowGenerator,
}: {
  width: number;
  height: number;
  depth: number;
  position?: Position;
  quaternion?: GameQuaternion;
  isWall?: boolean;
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

  if (position) {
    box.position.set(position.x, position.y, position.z);
  }

  if (quaternion) {
    box.rotationQuaternion = new Quaternion(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );
  }

  if (isWall) {
    box.isVisible = false;
  } else {
    shadowGenerator.addShadowCaster(box, true);
  }

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

const addVehicle = ({
  // colorName,
  scene,
}: // shadowGenerator,
{
  colorName: string;
  scene: Scene;
  shadowGenerator: ShadowGenerator;
}) => {
  // const car = addSphere({
  //   diameter: 2,
  //   shadowGenerator,
  // });

  // car.material = scene.getMaterialByName(colorName);

  const chassisMesh = MeshBuilder.CreateBox("Chassis", {
    width: 1,
    height: 0.4,
    depth: 2,
  });
  chassisMesh.position.y = 5;
  chassisMesh.position.x = 0;
  chassisMesh.rotationQuaternion = new Quaternion();

  const chassisPhysicsShape = new PhysicsShapeConvexHull(chassisMesh, scene);

  const chassisPhysicsBody = new PhysicsBody(
    chassisMesh,
    PhysicsMotionType.DYNAMIC,
    false,
    scene
  );
  chassisPhysicsBody.shape = chassisPhysicsShape;
  chassisPhysicsBody.setMassProperties({
    centerOfMass: new Vector3(0, -0.5, 0),
  });
  chassisPhysicsShape.filterMembershipMask = 2;

  let wheelMesh = MeshBuilder.CreateCylinder("WheelMesh", {
    height: 0.3,
    diameter: 0.4,
  }) as Mesh | InstancedMesh;
  const wheelMeshes = [
    wheelMesh,
    wheelMesh.createInstance("1"),
    wheelMesh.createInstance("2"),
    wheelMesh.createInstance("3"),
  ];
  wheelMeshes.forEach((mesh) => {
    mesh.rotationQuaternion = new Quaternion();
  });

  const vehicle = new RaycastVehicle(chassisPhysicsBody, scene);
  vehicle.numberOfFramesToPredict = 20; //Number of frames to predict future upwards orientation if airborne
  vehicle.predictionRatio = 1; //[0-1]How quickly to correct angular velocity towards future orientation. 0 = disabled

  const wheelConfig = {
    positionLocal: new Vector3(0.49, 0, -0.7), //Local connection point on the chassis
    suspensionRestLength: 0.6, //Rest length when suspension is fully decompressed
    suspensionForce: 15000, //Max force to apply to the suspension/spring
    suspensionDamping: 0.15, //[0-1] Damper force in percentage of suspensionForce
    suspensionAxisLocal: new Vector3(0, -1, 0), //Direction of the spring
    axleAxisLocal: new Vector3(1, 0, 0), //Axis the wheel spins around
    forwardAxisLocal: new Vector3(0, 0, 1), //Forward direction of the wheel
    sideForcePositionRatio: 0.1, //[0-1]0 = wheel position, 1 = connection point
    sideForce: 40, //Force applied to counter wheel drifting
    radius: 0.2,
    rotationMultiplier: 0.1, //How fast to spin the wheel
  };

  vehicle.addWheel(new RaycastWheel(wheelConfig)); //Right rear

  vehicle.addWheel(new RaycastWheel(wheelConfig)); //Right rear

  wheelConfig.positionLocal.set(-0.49, 0, -0.7); //Left rear
  vehicle.addWheel(new RaycastWheel(wheelConfig));

  wheelConfig.positionLocal.set(-0.49, 0, 0.8);
  vehicle.addWheel(new RaycastWheel(wheelConfig)); //Left front

  wheelConfig.positionLocal.set(0.49, 0, 0.8);
  vehicle.addWheel(new RaycastWheel(wheelConfig)); //Right front

  //Attempt at some anti rolling
  vehicle.addAntiRollAxle({ wheelA: 0, wheelB: 1, force: 10000 }); // right rear - left rear
  vehicle.addAntiRollAxle({ wheelA: 2, wheelB: 3, force: 10000 }); // left front - right rear

  const maxVehicleForce = 2200;
  const maxSteerValue = 0.6;
  const steeringIncrement = 0.005;
  const steerRecover = 0.05;
  let forwardForce = 0;
  let steerValue = 0;
  let steerDirection = 0;

  scene.onBeforeRenderObservable.add(() => {
    forwardForce = 0;
    steerDirection = 0;

    steerValue += steerDirection * steeringIncrement;
    steerValue = Math.min(Math.max(steerValue, -maxSteerValue), maxSteerValue);
    steerValue *= 1 - (1 - Math.abs(steerDirection)) * steerRecover;
    vehicle.wheels[2].steering = steerValue;
    vehicle.wheels[3].steering = steerValue;

    vehicle.wheels[2].force = forwardForce * maxVehicleForce;
    vehicle.wheels[3].force = forwardForce * maxVehicleForce;

    vehicle.update();

    console.log(vehicle.wheels[0].transform.position);

    vehicle.wheels.forEach((wheel, index) => {
      if (!wheelMeshes[index]) return;
      wheelMesh = wheelMeshes[index];
      wheelMesh.position.copyFrom(wheel.transform.position);

      if (wheelMesh.rotationQuaternion) {
        wheelMesh.rotationQuaternion.copyFrom(
          wheel.transform.rotationQuaternion
        );
      }

      wheelMesh.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
    });

    if (vehicle.nWheelsOnGround <= 2) {
      chassisPhysicsBody.setMassProperties({
        centerOfMass: new Vector3(0, 0, 0),
      });
    } else {
      chassisPhysicsBody.setMassProperties({
        centerOfMass: new Vector3(0, -0.5, 0),
      });
    }
  });

  return vehicle;
};

const addRigidVehicle = ({
  colorName,
  scene,
  shadowGenerator,
}: {
  colorName: string;
  scene: Scene;
  shadowGenerator: ShadowGenerator;
}) => {
  const carChassisSize = {
    width: 4,
    height: 0.5,
    depth: 2,
  };
  const carWheelSize = 0.8;

  const carBody = addBox({
    width: carChassisSize.width,
    height: carChassisSize.height,
    depth: carChassisSize.depth,
    shadowGenerator,
  });

  carBody.material = scene.getMaterialByName(colorName);

  let wheels = [];

  // wheels
  for (let idx = 0; idx < 4; idx++) {
    const wheel = addSphere({
      diameter: carWheelSize,
      shadowGenerator,
    });
    wheel.material = scene.getMaterialByName(COLOR_NAMES.BLACK);
    wheels.push(wheel);
  }

  return {
    body: carBody,
    wheels,
  };
};

const TOAST_COLORS = {
  RED: "linear-gradient(to right, rgb(255, 95, 109), rgb(255, 195, 113))",
};

const debounce = (func: Function, timeFrame: number = 500) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Array<any>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, timeFrame);
  };
};

const throttle = (func: Function, timeFrame: number = 0) => {
  let lastTime = 0;

  return function (...args: any) {
    let now = Date.now();

    if (now - lastTime >= timeFrame) {
      func(...args);
      lastTime = now;
    }
  };
};

const log = throttle((...args: Array<any>) => {
  console.log(...args);
}, 1000);

const toggleStartRaceBtns = (
  startRaceBtn: HTMLElement,
  canStartTheRace: boolean
) => {
  if (canStartTheRace) {
    startRaceBtn.removeAttribute("disabled");
  } else {
    startRaceBtn.setAttribute("disabled", "disabled");
  }
};

export {
  addBox,
  addColors,
  addPlane,
  addSphere,
  addRigidVehicle,
  addVehicle,
  debounce,
  log,
  toggleStartRaceBtns,
  TOAST_COLORS,
};
