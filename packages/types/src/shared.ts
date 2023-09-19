const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

interface Actions {
  [ACCELERATE]: boolean;
  [BRAKE]: boolean;
  [LEFT]: boolean;
  [RIGHT]: boolean;
}

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

type Position = {
  x: number;
  y: number;
  z: number;
};

type RoomUser = {
  username: string;
};

type RoomList = Array<RoomUser>;

type User = {
  connected: boolean;
  userID: string;
  username: string;
};

type UsersList = Array<User>;

export type {
  Actions,
  GameConfig,
  GameObject,
  GameQuaternion,
  Position,
  RoomList,
  User,
  UsersList,
};
