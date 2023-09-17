import type { RoomList, UI, User, UsersList } from "./client";

type Game = {
  elements: {
    joinRaceRoomBtn: HTMLElement;
    leaveRaceRoomBtn: HTMLElement;
    startRaceBtn: HTMLElement;
  };
  isDevelopment: boolean;
  playersMap: Array<any>;
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

type SessionInfo = {
  sessionID: string;
  userID: string;
};

type ActionTypes = "accelerate" | "brake" | "left" | "right";

interface ServerToClientEvents {
  "client-dev:stop the race": () => void;
  "client:action": (data: { playerActions: Array<ActionTypes>, id: string }) => void;
  "client:join race room": () => void;
  "client:leave race room": () => void;
  "client:set name": (data: { userID: string; username: string }) => void;
  "client:start the race": () => void;
  "server:action": (data: Object) => void;
  "server:close dialog": () => void;
  "server:send users": (data: UsersList) => void;
  "server:send room users": (data: RoomList) => void;
  "server:session": (data: SessionInfo) => void;
  "server:show error": (data: { message: string }) => void;
  "server:start-race": (data: Object) => void;
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
  UI,
  User,
  UsersList,
  ServerToClientEvents
};

export { FEATURES_NAMES, features } from "./features";
