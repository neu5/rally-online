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
// -------------------- //
type UsersMap = Map<
  string,
  {
    socketId: string;
  }
>;

type Race = {
  isStarted: boolean;
};

type GameInfo = {
  id: string;
  race: Race;
};

interface ServerToClientEvents {
  "player:get-users-list": () => void;
  "server:action": (data: Object) => void;
  "server:game-info": (data: GameInfo) => void;
  "server:start-race": (data: Object) => void;
  "server:stop-race": (data: Object) => void;
  "server:users-list-update": (playersList: Object) => void;
}

export { ACCELERATE, BRAKE, LEFT, RIGHT };
export type {
  ActionTypes,
  Actions,
  GameConfig,
  GameInfo,
  GameObject,
  GameQuaternion,
  KeysActions,
  Player,
  Position,
  ServerToClientEvents,
  UsersMap,
  VehicleTemplate,
};
