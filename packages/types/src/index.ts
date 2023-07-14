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
  setCurrentPlayer: (id: string) => void;
  DialogWrapper: Class;
};

type Game = {
  isDevelopment: boolean;
  rootEl: HTMLElement | null;
  ui: UI;
  usernameAlreadySelected: boolean;
};

type User = {
  connected: boolean;
  userID: string;
  username: string;
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
  "client:join race room": () => void;
  "client:set name": (data: { userID: string; username: string }) => void;
  // "server:action": (data: Object) => void;
  // "server:game-info": (data: GameInfo) => void;
  "server:close dialog": () => void;
  "server:send users": (data: UsersList) => void;
  "server:send room users": (data: RoomList) => void;
  "server:session": (data: SessionInfo) => void;
  "server:show error": (data: { message: string }) => void;
  // "server:start-race": (data: Object) => void;
  // "server:stop-race": (data: Object) => void;
  "server:user connected": (data: User) => void;
  "server:user disconnected": (data: { userID: string }) => void;
  "server:users-list-update": (playersList: UsersList) => void;
}

export type {
  Game,
  RoomList,
  User,
  UsersList,
  ServerToClientEvents,
  UI,
  UsersMap,
};

export { FEATURES_NAMES, features } from "./features";
