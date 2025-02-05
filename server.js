// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));  // Serve frontend files from 'public' folder

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Relay signaling messages between peers
  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);  // Send offer to other peer
  });

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);  // Send answer to other peer
  });

  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate);  // Send ICE candidate to other peer
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
