import { fileURLToPath } from "url";
import { resolve } from "path";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import type { ServerToClientEvents, UsersMap } from "@neu5/types/src";

import { createSocketHandlers } from "./sockets/sockets";

const getDirname = (meta: { url: string }) => fileURLToPath(meta.url);
const rootDir = getDirname(import.meta);
const distDir = resolve(rootDir, "../../../", "client/dist");

const app = express();
const httpServer = createServer(app);

const io = new Server<ServerToClientEvents>(httpServer);
const usersMap: UsersMap = new Map();

// const playersMap: PlayersMap = new Map();

// const race: Race = {
//   isStarted: false,
// };

io.on("connection", (socket) => {
  io.use((socket, next) => {
    const username = socket.handshake.auth.username;

    // Add username validation #159
    if (!username) {
      return next(new Error("invalid username"));
    }

    socket.username = username;
    next();
  });

  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      username: socket.username,
    });
  }
  // socket.emit("users", users);

  // createSocketHandlers({ io, socket, usersMap });
});

app.use(express.static(distDir));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: distDir });
});

export const server = httpServer.listen(process.env.PORT || 5000);
