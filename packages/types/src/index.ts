type UsersMap = Map<
  string,
  {
    socketId: string;
  }
>;

type GameInfo = {
  socketId: string;
};

interface ServerToClientEvents {
  // "player:get-users-list": () => void;
  // "server:action": (data: Object) => void;
  "server:game-info": (data: GameInfo) => void;
  // "server:start-race": (data: Object) => void;
  // "server:stop-race": (data: Object) => void;
  // "server:users-list-update": (playersList: Object) => void;
}

export type { ServerToClientEvents, UsersMap };
