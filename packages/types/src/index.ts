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

type UI = {
  createPlayersList: Function;
};

type Game = {
  thisPlayerSocketId: string | null;
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
