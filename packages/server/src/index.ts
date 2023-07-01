import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import { resolve } from "path";
import express from "express";
import { createServer } from "http";
import type { Socket } from "socket.io";
import { Server } from "socket.io";

import type { ServerToClientEvents /*UsersMap*/ } from "@neu5/types/src";
import { InMemorySessionStore } from "./sessionStore";
// import { createSocketHandlers } from "./sockets/sockets";

const getDirname = (meta: { url: string }) => fileURLToPath(meta.url);
const rootDir = getDirname(import.meta);
const distDir = resolve(rootDir, "../../../", "client/dist");

const app = express();
const httpServer = createServer(app);

const randomId = () => randomBytes(8).toString("hex");
const sessionStore = new InMemorySessionStore();

const io = new Server<ServerToClientEvents>(httpServer);
// const usersMap: UsersMap = new Map();

// const playersMap: PlayersMap = new Map();

// const race: Race = {
//   isStarted: false,
// };

// fetch existing users
const users: { connected: boolean; userID: string; username: string }[] = [];

io.use((socket: Socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    // find existing session
    const session = sessionStore.findSession(sessionID);
    if (session) {
      socket.data.sessionID = sessionID;
      socket.data.userID = session.userID;
      socket.data.username = session.username;
      return next();
    }
  }
  const username = socket.handshake.auth.username;

  if (!username) {
    return next(new Error("invalid username"));
  }

  // create new session
  socket.data.sessionID = randomId();
  socket.data.userID = randomId();

  if (
    !(
      typeof username === "string" &&
      username.length >= 2 &&
      username.length <= 16 &&
      /^[\w]+$/.test(username)
    )
  ) {
    socket.emit("server:show error", { message: "Wrong input" });
    return next();
  }

  let isPlayerNameAlreadyTaken: boolean = false;

  users.forEach((user) => {
    if (user.username === username) {
      isPlayerNameAlreadyTaken = true;
    }
  });

  if (isPlayerNameAlreadyTaken) {
    socket.emit("server:show error", {
      message: "That name is already taken. Choose different name",
    });
    return next();
  }

  socket.data.username = username;

  next();
});

io.on("connection", (socket) => {
  if (socket.data.username === undefined) {
    return;
  }

  // persist session
  sessionStore.saveSession(socket.data.sessionID, {
    userID: socket.data.userID,
    username: socket.data.username,
    connected: true,
  });

  // emit session details
  socket.emit("server:session", {
    sessionID: socket.data.sessionID,
    userID: socket.data.userID,
  });

  // join the "userID" room
  socket.join(socket.data.userID);

  sessionStore.findAllSessions().forEach((userData) => {
    if (userData.username !== undefined) {
      users.push({ ...userData });
    }
  });

  socket.emit("server:send users", users);

  // notify existing users
  socket.broadcast.emit("server:user connected", {
    userID: socket.data.userID,
    username: socket.data.username,
    connected: true,
  });

  socket.emit("server:close dialog");

  // createSocketHandlers({ io, socket, usersMap });
  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.data.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      // notify other users
      socket.broadcast.emit("server:user disconnected", socket.data.userID);
      // update the connection status of the session
      sessionStore.saveSession(socket.data.sessionID, {
        userID: socket.data.userID,
        username: socket.data.username,
        connected: false,
      });
    }
  });
});

app.use(express.static(distDir));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: distDir });
});

export const server = httpServer.listen(process.env.PORT || 5000);
