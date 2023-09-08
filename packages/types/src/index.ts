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

type UsersMap = Map<
  string,
  {
    socketId: string;
    displayName: string;
  }
>;

type Class = { new (...args: any[]): any };

type UI = {
  createPlayersList: (list: UsersList) => void;
  createRoomList: (list: RoomList) => void;
  hideElement: (element: HTMLElement) => void;
  setCurrentPlayer: (id: string) => void;
  showElement: (element: HTMLElement) => void;
  DialogWrapper: Class;
};

type Game = {
  elements: {
    joinRaceRoomBtn: HTMLElement;
    leaveRaceRoomBtn: HTMLElement;
    startRaceBtn: HTMLElement;
  };
  isDevelopment: boolean;
  roomUsers: RoomList;
  rootEl: HTMLElement | null;
  ui: UI;
  usernameAlreadySelected: boolean;
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

type User = {
  connected: boolean;
  userID: string;
  username: string;
};

type GameQuaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
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

type UsersList = Array<User>;

type RoomUser = {
  username: string;
};
type RoomList = Array<RoomUser>;

type SessionInfo = {
  sessionID: string;
  userID: string;
};

interface ServerToClientEvents {
  "client:action": ({ playerActions, id }: { playerActions: ActionTypes[]; id: string }) => void;
  "client:join race room": () => void;
  "client:leave race room": () => void;
  "client:set name": (data: { userID: string; username: string }) => void;
  "client:start the race": () => void;
  // "server:action": (data: Object) => void;
  // "server:game-info": (data: GameInfo) => void;
  "server:close dialog": () => void;
  "server:send users": (data: UsersList) => void;
  "server:send room users": (data: RoomList) => void;
  "server:session": (data: SessionInfo) => void;
  "server:show error": (data: { message: string }) => void;
  // "server:start-race": (data: Object) => void;
  // "server:stop-race": (data: Object) => void;
  "server:user can join the room": () => void;
  "server:user can leave the room": () => void;
  "server:user can start the race": () => void;
  "server:user cannot start the race": () => void;
  "server:user connected": (data: User) => void;
  "server:user disconnected": (data: { userID: string }) => void;
  "server:users-list-update": (playersList: UsersList) => void;
}

export type {
  ActionTypes,
  Game,
  GameConfig,
  GameObject,
  GameQuaternion,
  Position,
  RoomList,
  User,
  UsersList,
  ServerToClientEvents,
  UI,
  UsersMap,
};

export { FEATURES_NAMES, features } from "./features";
