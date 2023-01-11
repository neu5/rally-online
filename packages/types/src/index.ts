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

type Vector3 = {
  x: number;
  y: number;
  z: number;
};
type Quaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
};

type PlayerFromServer = {
  id: string;
  vehicle: {
    body: { position: Vector3; quaternion: Quaternion };
    wheels: Array<{ position: Vector3; quaternion: Quaternion }>;
  };
};

type PlayersFromServer = Array<PlayerFromServer>;

type Race = {
  isStarted: boolean;
};

type GameInfo = {
  id: string;
  race: Race;
};

type Car = {
  wheelMeshes: Array<any>;
};

type PlayersMap = Map<
  string,
  Player & {
    car?: Car;
  }
>;

interface ServerToClientEvents {
  "player:action": ({
    playerActions,
    id,
  }: {
    playerActions: ActionTypes[];
    id: string;
  }) => void;
  "player:get-users-list": () => void;
  "player:set-name": ({
    id,
    displayName,
  }: {
    id: string;
    displayName: string;
  }) => void;
  "player:start-race": () => void;
  "player:stop-race": () => void;
  "server:action": (data: PlayersFromServer) => void;
  "server:close-dialog": () => void;
  "server:game-info": (gameInfo: GameInfo) => void;
  "server:show-error": ({ message }: { message: string }) => void;
  "server:start-race": ({
    objects,
    config,
    race,
  }: {
    objects: GameObject[];
    config: GameConfig;
    race: Race;
  }) => void;
  "server:stop-race": (race: Race) => void;
  "server:users-list-update": (playersList: Array<PlayersMap>) => void;
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
  PlayerFromServer,
  PlayersFromServer,
  PlayersMap,
  Position,
  Race,
  ServerToClientEvents,
  VehicleTemplate,
};
