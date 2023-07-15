import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import { resolve } from "path";
import express from "express";
import { createServer } from "http";
import type { Socket } from "socket.io";
import { Server } from "socket.io";

import type { ServerToClientEvents /*UsersMap*/ } from "@neu5/types/src";
import { InMemorySessionStore } from "./sessionStore";
import { createSocketHandlers } from "./sockets/sockets";

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
  createSocketHandlers({ io, sessionStore, socket });
});

app.use(express.static(distDir));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: distDir });
});

export const server = httpServer.listen(process.env.PORT || 5000);
