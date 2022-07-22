import { Color3, Scene, StandardMaterial, Texture } from "@babylonjs/core";

const COLOR_NAMES = {
  BLUE: "BlueMaterial",
  GREEN: "GreenMaterial",
  RED: "RedMaterial",
  YELLOW: "YellowMaterial",
} as const;

const colors: Array<{ name: string; color: Color3 }> = [
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

const addWheelMaterial = () => {
  const wheelMat = new StandardMaterial("wheelMaterial");
  wheelMat.diffuseTexture = new Texture("../../../assets/wheel.png");
};

export { addColors, addWheelMaterial };
