import type { RoomList, User, UsersList } from './shared';

type SessionInfo = {
    sessionID: string;
    userID: string;
};

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

export type { ServerEvents };
