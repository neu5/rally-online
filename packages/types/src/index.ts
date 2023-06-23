type UsersMap = Map<
  string,
  {
    socketId: string;
    displayName: string;
  }
>;

type GameInfo = {
  socketId: string;
};

type Class = { new (...args: any[]): any };

type UI = {
  createPlayersList: (list: PlayersList) => void;
  setCurrentPlayer: (id: string) => void;
  DialogWrapper: Class;
};

type Game = {
  thisPlayerSocketId: string | null;
  usernameAlreadySelected: boolean;
  rootEl: HTMLElement | null;
  ui: UI;
};

type PlayersList = Array<{
  socketId: string;
  displayName: string;
}>;

interface ServerToClientEvents {
  "player:get-users-list": () => void;
  // "server:action": (data: Object) => void;
  "server:game-info": (data: GameInfo) => void;
  // "server:start-race": (data: Object) => void;
  // "server:stop-race": (data: Object) => void;
  "server:users-list-update": (playersList: PlayersList) => void;
}

export type { Game, PlayersList, ServerToClientEvents, UI, UsersMap };

export { FEATURES_NAMES, features } from "./features";
