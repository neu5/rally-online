// @todo: Create package with shared code #77
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

interface KeysActions {
  KeyW: string;
  KeyS: string;
  KeyA: string;
  KeyD: string;
}

type VehicleTemplate = {
  wheels: Array<{
    position: any;
    quaternion: any;
    rotationQuaternion?: any;
  }>;
  body: {
    position: any;
    quaternion?: any;
    rotationQuaternion?: any;
  };
  physicalVehicle: any;
};

type Position = {
  x: number;
  y: number;
  z: number;
};

type GameConfig = {
  width: number;
  height: number;
  depth: number;
};

type GameObject = {
  name: string;
  isWall: boolean;
  position: Position;
  quaternion: GameQuaternion;
  width: number;
  height: number;
  depth: number;
};

type GameQuaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
};

type Player = {
  updateAction?: (actions: Actions) => void;
  actions: Actions;
  actionsFromServer?: Actions;
  displayName: string;
  socketId: string;
  vehicle?: VehicleTemplate;
  isCurrentPlayer: boolean;
  vehicleSteering: number;
  UIindicator?: HTMLElement;
};

export { ACCELERATE, BRAKE, LEFT, RIGHT };
export type {
  ActionTypes,
  Actions,
  GameConfig,
  GameObject,
  GameQuaternion,
  KeysActions,
  Player,
  Position,
  VehicleTemplate,
};
