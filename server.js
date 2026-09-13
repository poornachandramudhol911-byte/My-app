const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const users = new Map();
const history = [];

io.on("connection", socket => {
  socket.on("join", ({ name }) => {
    const clean = String(name || "Guest").trim().slice(0, 30) || "Guest";
    users.set(socket.id, clean);
    socket.emit("history", history.slice(-100));
    io.emit("presence", Array.from(users.values()));
  });

  socket.on("message", text => {
    const name = users.get(socket.id) || "Guest";
    const body = String(text || "").trim().slice(0, 2000);
    if (!body) return;
    const msg = { id: Date.now() + Math.random(), name, text: body, time: new Date().toISOString() };
    history.push(msg);
    if (history.length > 500) history.shift();
    io.emit("message", msg);
  });

  socket.on("typing", active => {
    socket.broadcast.emit("typing", { name: users.get(socket.id) || "Someone", active: !!active });
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    io.emit("presence", Array.from(users.values()));
  });
});

server.listen(PORT, () => console.log(`NexaChat running at http://localhost:${PORT}`));