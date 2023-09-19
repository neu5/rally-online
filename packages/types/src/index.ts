import type { Actions, RoomList, User, UsersList } from './shared';
import type { ActionTypes, ClientEvents, PlayerFromServer, PlayersFromServer, UI } from "./client";
import type { ServerEvents } from './server';

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

interface ServerToClientEvents extends ClientEvents, ServerEvents { }

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
  ServerToClientEvents
};

export { FEATURES_NAMES, features } from "./features";
