export interface ServerToClientEvents {
  playerListUpdate: (playersList: Object) => void;
  playerID: (id: string) => void;
}
