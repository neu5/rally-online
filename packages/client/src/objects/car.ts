import earcut from "earcut";
import {
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
  Vector4,
} from "@babylonjs/core";

export const buildCar = (scene: Scene) => {
  //base
  const outline = [new Vector3(-0.3, 0, -0.1), new Vector3(0.2, 0, -0.1)];

  //curved front
  for (let i = 0; i < 20; i++) {
    outline.push(
      new Vector3(
        0.2 * Math.cos((i * Math.PI) / 40),
        0,
        0.2 * Math.sin((i * Math.PI) / 40) - 0.1
      )
    );
  }

  //top
  outline.push(new Vector3(0, 0, 0.1));
  outline.push(new Vector3(-0.3, 0, 0.1));

  //back formed automatically

  //car face UVs
  const faceUV = [];
  faceUV[0] = new Vector4(0, 0.5, 0.38, 1);
  faceUV[1] = new Vector4(0, 0, 1, 0.5);
  faceUV[2] = new Vector4(0.38, 1, 0, 0.5);

  //car material
  const carMat = new StandardMaterial("carMat");
  carMat.diffuseTexture = new Texture("assets/car.png");

  const car = MeshBuilder.ExtrudePolygon(
    "car",
    {
      shape: outline,
      depth: 0.2,
      faceUV: faceUV,
      wrap: true,
    },
    scene,
    earcut
  );
  car.material = carMat;

  //wheel face UVs
  const wheelUV = [];
  wheelUV[0] = new Vector4(0, 0, 1, 1);
  wheelUV[1] = new Vector4(0, 0.5, 0, 0.5);
  wheelUV[2] = new Vector4(0, 0, 1, 1);

  //car material
  const wheelMat = new StandardMaterial("wheelMat");
  wheelMat.diffuseTexture = new Texture("assets/wheel.png");

  const wheelRB = MeshBuilder.CreateCylinder("wheelRB", {
    diameter: 0.125,
    height: 0.05,
    faceUV: wheelUV,
  });
  wheelRB.material = wheelMat;
  wheelRB.parent = car;
  wheelRB.position.z = -0.1;
  wheelRB.position.x = -0.2;
  wheelRB.position.y = 0.035;

  const wheelRF = wheelRB.clone("wheelRF");
  wheelRF.position.x = 0.1;

  const wheelLB = wheelRB.clone("wheelLB");
  wheelLB.position.y = -0.2 - 0.035;

  const wheelLF = wheelRF.clone("wheelLF");
  wheelLF.position.y = -0.2 - 0.035;

  return car;
};
