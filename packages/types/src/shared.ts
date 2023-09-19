const ACCELERATE = "accelerate";
const BRAKE = "brake";
const LEFT = "left";
const RIGHT = "right";

interface Actions {
    [ACCELERATE]: boolean;
    [BRAKE]: boolean;
    [LEFT]: boolean;
    [RIGHT]: boolean;
}

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

export type { Actions, RoomList, User, UsersList };
