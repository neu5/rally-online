import type { Server, Socket } from "socket.io";
import type {
  // PlayersList,
  ServerToClientEvents,
  User,
  // UsersMap,
} from "@neu5/types/src";
import type { InMemorySessionStore } from "../sessionStore";

// const usersMapToArray = (usersMap: UsersMap): PlayersList =>
//   Array.from(usersMap).map(([id, { displayName, socketId }]) => ({
//     displayName,
//     id,
//     socketId,
//   }));

const RACE_ROOM_NAME = "race room 1" as const;

const emitRoomInfo = async ({
  io,
  sessionStore,
}: {
  io: Server<ServerToClientEvents>;
  sessionStore: InMemorySessionStore;
}) => {
  const socketsInTheRoom = await io.in(RACE_ROOM_NAME).fetchSockets();

  io.emit(
    "server:send room users",
    socketsInTheRoom.map((session) =>
      sessionStore.findSession(session.data.sessionID)
    )
  );
};

const createSocketHandlers = ({
  io,
  sessionStore,
  socket,
}: {
  io: Server<ServerToClientEvents>;
  sessionStore: InMemorySessionStore;
  socket: Socket<ServerToClientEvents>;
}) => {
  // persist session
  sessionStore.saveSession(socket.data.sessionID, {
    connected: true,
    userID: socket.data.userID,
    username: socket.data.username,
  });

  // emit session details
  socket.emit("server:session", {
    sessionID: socket.data.sessionID,
    userID: socket.data.userID,
  });

  if (socket.data.username) {
    // notify existing users
    socket.broadcast.emit("server:user connected", {
      connected: socket.data.connected,
      userID: socket.data.userID,
      username: socket.data.username,
    });

    io.emit("server:send users", sessionStore.getAuthorizedUsers());
    socket.emit("server:close dialog");
  }

  socket.on("client:set name", ({ username, userID }) => {
    const user: User = sessionStore
      .findAllSessions()
      .find((u) => u.userID === userID);

    if (!user) {
      return;
    }
    if (
      !(
        typeof username === "string" &&
        username.length >= 3 &&
        username.length <= 16 &&
        /^[\w]+$/.test(username)
      )
    ) {
      socket.emit("server:show error", { message: "Wrong input" });
      return;
    }
    let isPlayerNameAlreadyTaken: boolean = false;
    sessionStore.findAllSessions().forEach((u) => {
      if (u.username === username) {
        isPlayerNameAlreadyTaken = true;
      }
    });
    if (isPlayerNameAlreadyTaken) {
      socket.emit("server:show error", {
        message: "That name is already taken. Choose different name",
      });
      return;
    }

    sessionStore.saveSession(socket.data.sessionID, {
      ...user,
      username,
    });

    io.emit("server:send users", sessionStore.getAuthorizedUsers());
    emitRoomInfo({ io, sessionStore });
    socket.emit("server:close dialog");
  });

  socket.on("client:join race room", async () => {
    socket.join(RACE_ROOM_NAME);

    emitRoomInfo({ io, sessionStore });
  });
  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.data.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;

    const user: User = sessionStore
      .findAllSessions()
      .find((u) => u.userID === socket.data.userID);

    if (isDisconnected) {
      // update the connection status of the session
      sessionStore.saveSession(socket.data.sessionID, {
        ...user,
        connected: false,
      });
      // notify other users
      socket.broadcast.emit("server:user disconnected", socket.data.userID);

      io.emit("server:send users", sessionStore.getAuthorizedUsers());
    }
  });
};

export { createSocketHandlers };
