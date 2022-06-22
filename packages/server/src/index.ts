import { fileURLToPath } from "url";
import { resolve } from "path";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const getDirname = (meta: { url: string }) => fileURLToPath(meta.url);
const rootDir = getDirname(import.meta);
const distDir = resolve(rootDir, "../../../", "client/dist");

const app = express();
const httpServer = createServer(app);

interface ServerToClientEvents {
  playerConnected: (playersList: Object) => void;
  playerLeft: (playersList: Object) => void;
}
const io = new Server<ServerToClientEvents>(httpServer);

const playersList = new Map();

io.on("connection", (socket) => {
  playersList.set(socket.id, { name: socket.id });

  socket.on("disconnect", () => {
    playersList.delete(socket.id);

    io.emit(
      "playerLeft",
      Array.from(playersList, ([id, data]) => ({ id, data }))
    );
  });

  io.emit(
    "playerConnected",
    Array.from(playersList, ([id, data]) => ({ id, data }))
  );
});

app.use(express.static(distDir));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: distDir });
});

export const server = httpServer.listen(process.env.PORT || 5000);
