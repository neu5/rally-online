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
  color?: string;
  startingPos?: {
    x: number;
    y: number;
    z: number;
  };
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
};

type Position = {
  x: number;
  y: number;
  z: number;
};

type Player = {
  updateAction?: (actions: Actions) => void;
  actions: Actions;
  actionsFromServer?: Actions;
  name: string;
  vehicle?: VehicleTemplate;
  isCurrentPlayer: boolean;
  vehicleSteering: number;
  UIindicator?: HTMLElement;
};

export { ACCELERATE, BRAKE, LEFT, RIGHT };
export type {
  ActionTypes,
  Actions,
  KeysActions,
  Player,
  Position,
  VehicleTemplate,
};
