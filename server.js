require("dotenv").config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const app = require('./app');


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Client connecté : ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log(`Client déconnecté : ${socket.id}`);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
