type Class = { new(...args: any[]): any };

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

type RoomUser = {
    username: string;
};

type RoomList = Array<RoomUser>;

type User = {
    connected: boolean;
    userID: string;
    username: string;
};

type UsersList = Array<User>;

type UI = {
    createPlayersList: (list: UsersList) => void;
    createRoomList: (list: RoomList) => void;
    hideElement: (element: HTMLElement) => void;
    setCurrentPlayer: (id: string) => void;
    showElement: (element: HTMLElement) => void;
    DialogWrapper: Class;
};

export type { PlayerFromServer, PlayersFromServer, RoomList, User, UsersList, UI };