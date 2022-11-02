import type { World } from "cannon-es";
import { Body, Box, Material, RigidVehicle, Sphere, Vec3 } from "cannon-es";
import type { Position } from "@neu5/types/src";

const addBox = ({
  width,
  height,
  depth,
  position,
  mass,
  world,
}: {
  width: number;
  height: number;
  depth: number;
  position: Position;
  mass: number;
  world: World;
}) => {
  // Physics
  const halfExtents = new Vec3(width * 0.5, height * 0.5, depth * 0.5);
  const shape = new Box(halfExtents);
  const body = new Body({ mass });
  body.addShape(shape);
  body.position.set(position.x, position.y, position.z);
  world.addBody(body);

  return body;
};

const addSphere = ({
  mass,
  wheelMaterial = undefined,
  position,
  radius,
  world,
}: {
  radius: number;
  position: Position;
  mass: number;
  wheelMaterial: Material | undefined;
  world: World;
}) => {
  // Physics
  const body = new Body({
    mass,
    position: new Vec3(position.x, position.y, position.z),
    ...(wheelMaterial ? { wheelMaterial } : {}),
  });
  const shape = new Sphere(radius);
  body.addShape(shape);
  body.position.set(position.x, position.y, position.z);
  world.addBody(body);

  return body;
};

// car
const addRigidVehicle = ({
  position,
  world,
}: {
  position: Position;
  world: World;
}) => {
  const carChassisSize = {
    width: 4,
    height: 0.5,
    depth: 2,
  };
  const carWheelSize = 0.5;

  const carBody = addBox({
    mass: 5,
    position,
    width: carChassisSize.width,
    height: carChassisSize.height,
    depth: carChassisSize.depth,
    world,
  });

  // because of some reason it looks like it's upside down
  carBody.quaternion.setFromEuler(-Math.PI, 0, 0);

  const vehicle = new RigidVehicle({
    chassisBody: carBody,
  });

  // wheels
  const wheelMass = 1;
  const axisWidth = carChassisSize.width;
  const wheelMaterial = new Material("wheel");
  const down = new Vec3(0, -1, 0);

  for (let idx = 0; idx < 4; idx++) {
    const wheelBody = addSphere({
      mass: wheelMass,
      wheelMaterial,
      position: { x: 0, y: 0, z: 0 },
      radius: carWheelSize,
      world,
    });

    wheelBody.angularDamping = 0.4;
    const isFrontAxis = idx < 2 ? -1 : 1;
    const yPos = idx % 2 === 0 ? 1 : -1;

    vehicle.addWheel({
      body: wheelBody,
      position: new Vec3(isFrontAxis, 0.3, (axisWidth * yPos) / 6),
      axis: new Vec3(0, 0, isFrontAxis),
      direction: down,
    });
  }

  vehicle.addToWorld(world);

  return vehicle;
};

export { addBox, addRigidVehicle, addSphere };
