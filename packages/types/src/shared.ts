
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

export type { RoomList, User, UsersList };