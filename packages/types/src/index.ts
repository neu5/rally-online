import type {
  Actions,
  GameConfig,
  GameObject,
  GameQuaternion,
  Position,
  RoomList,
  User,
  UsersList,
} from "./shared";
import type {
  ActionTypes,
  ClientEvents,
  Game,
  PlayerFromServer,
  PlayersFromServer,
  UI,
} from "./client";
import type { ServerEvents } from "./server";

interface ServerToClientEvents extends ClientEvents, ServerEvents {}

export type {
  Actions,
  ActionTypes,
  Game,
  GameConfig,
  GameObject,
  GameQuaternion,
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
