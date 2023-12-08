import type { Actions, Position, RoomList, User, UsersList } from "./shared";

type SessionInfo = {
  sessionID: string;
  userID: string;
};

type VehicleTemplate = {
  wheels: Array<{
    position: Position;
    quaternion: any;
    rotationQuaternion?: any;
  }>;
  body: {
    position: Position;
    quaternion?: any;
    rotationQuaternion?: any;
  };
  physicalVehicle: any;
};

type PlayersList = Array<
  User & {
    accelerateTimeMS: number;
    actions: Actions;
    vehicle: VehicleTemplate;
    turnTimeMS: number;
    vehicleSteering: number;
    playerNumber: number;
    color: string;
    sphere: any;
    startingPos: Position;
  }
>;

interface ServerEvents {
  "server:action": (data: Object) => void;
  "server:close dialog": () => void;
  "server:send users": (data: UsersList) => void;
  "server:send room users": (data: RoomList) => void;
  "server:session": (data: SessionInfo) => void;
  "server:show error": (data: { message: string }) => void;
  "server:start-race": (data: Object) => void;
  "server:user can join the room": () => void;
  "server:user can leave the room": () => void;
  "server:user can start the race": () => void;
  "server:user cannot start the race": () => void;
  "server:user connected": (data: User) => void;
  "server:user disconnected": (data: { userID: string }) => void;
}

export type { PlayersList, ServerEvents };
