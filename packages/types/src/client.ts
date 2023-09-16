type Class = { new(...args: any[]): any };

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

export type { RoomList, User, UsersList, UI };