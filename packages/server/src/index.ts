import { fileURLToPath } from "url";
import { resolve } from "path";
import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const getDirname = (meta: { url: string }) => fileURLToPath(meta.url);
const rootDir = getDirname(import.meta);
const distDir = resolve(rootDir, "../../../", "client/dist");

const app = express();
const httpServer = createServer(app);

interface ServerToClientEvents {
  playerConnected: (playersList: Object) => void;
  playerLeft: (playersList: Object) => void;
  playerID: (id: string) => void;
}
const io = new Server<ServerToClientEvents>(httpServer);

const playersList = new Map();

const createSocketHandlers = (socket: Socket) => {
  socket.on("disconnect", () => {
    playersList.delete(socket.id);

    io.emit(
      "playerLeft",
      Array.from(playersList, ([id, data]) => ({ id, data }))
    );
  });
};

io.on("connection", (socket) => {
  playersList.set(socket.id, { name: socket.id });

  createSocketHandlers(socket);

  io.emit(
    "playerConnected",
    Array.from(playersList, ([id, data]) => ({ id, data }))
  );

  socket.emit("playerID", socket.id);
});

app.use(express.static(distDir));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: distDir });
});

export const server = httpServer.listen(process.env.PORT || 5000);
