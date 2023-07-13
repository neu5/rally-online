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

io.use((socket: Socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;

  if (sessionID) {
    const session = sessionStore.findSession(sessionID);

    if (session) {
      socket.data.sessionID = sessionID;
      socket.data.userID = session.userID;
      socket.data.username = session.username;
      return next();
    }
  }

  const username = socket.handshake.auth.username;

  socket.data.sessionID = randomId();
  socket.data.userID = randomId();
  socket.data.username = username;
  next();
});

io.on("connection", (socket) => {
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

  // join the "userID" room
  socket.join(socket.data.userID);

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
    const user = sessionStore
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
    user.username = username;
    io.emit("server:send users", sessionStore.getAuthorizedUsers());
    socket.emit("server:close dialog");
  });

  // createSocketHandlers({ io, socket, usersMap });
  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.data.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      // update the connection status of the session
      sessionStore.saveSession(socket.data.sessionID, {
        connected: false,
        userID: socket.data.userID,
        username: socket.data.username,
      });
      // notify other users
      socket.broadcast.emit("server:user disconnected", socket.data.userID);

      io.emit("server:send users", sessionStore.getAuthorizedUsers());
    }
  });
});

app.use(express.static(distDir));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: distDir });
});

export const server = httpServer.listen(process.env.PORT || 5000);
