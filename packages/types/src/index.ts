import type {
  Actions,
  GameConfig,
  GameObject,
  GameQuaternion,
  Game as GameServer,
  Position,
  RoomList,
  User,
  UsersList,
} from "./shared";
import type {
  ActionTypes,
  ClientEvents,
  Game as GameClient,
  PlayerFromServer,
  PlayersFromServer,
  UI,
} from "./client";
import type { PlayersList, ServerEvents } from "./server";

interface ServerToClientEvents extends ClientEvents, ServerEvents {}

export type {
  Actions,
  ActionTypes,
  GameClient,
  GameServer,
  GameConfig,
  GameObject,
  GameQuaternion,
  PlayersList,
  PlayerFromServer,
  PlayersFromServer,
  Position,
  RoomList,
  UI,
  User,
  UsersList,
  ServerToClientEvents,
};

export { FEATURES_NAMES, features } from "./features";
