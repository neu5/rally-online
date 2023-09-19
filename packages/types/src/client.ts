import type { RoomList, UsersList } from "./shared";

type ActionTypes = "accelerate" | "brake" | "left" | "right";

type Class = { new (...args: any[]): any };

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

type PlayerFromServer = {
  color: string;
  userID: string;
  username: string;
  vehicle: {
    body: { position: any; rotationQuaternion: any; quaternion: any };
    wheels: Array<{ position: any; rotationQuaternion: any; quaternion: any }>;
  };
};

type PlayersFromServer = Array<PlayerFromServer>;

type UI = {
  createPlayersList: (list: UsersList) => void;
  createRoomList: (list: RoomList) => void;
  hideElement: (element: HTMLElement) => void;
  setCurrentPlayer: (id: string) => void;
  showElement: (element: HTMLElement) => void;
  DialogWrapper: Class;
};

interface ClientEvents {
  "client-dev:stop the race": () => void;
  "client:action": (data: {
    playerActions: Array<ActionTypes>;
    id: string;
  }) => void;
  "client:join race room": () => void;
  "client:leave race room": () => void;
  "client:set name": (data: { userID: string; username: string }) => void;
  "client:start the race": () => void;
}

export type {
  ActionTypes,
  ClientEvents,
  Game,
  PlayerFromServer,
  PlayersFromServer,
  UI,
};
