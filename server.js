const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let tournamentPlayers = [];

io.on('connection', (socket) => {
  console.log('አዲስ ተጫዋች ተቀላቀለ:', socket.id);

  socket.on('move', (move) => {
    socket.broadcast.emit('opponentMove', move);
  });

  socket.on('joinTournament', (playerName) => {
    tournamentPlayers.push({ id: socket.id, name: playerName || 'Ethio Player' });
    if (tournamentPlayers.length >= 2) {
      let player1 = tournamentPlayers.shift();
      let player2 = tournamentPlayers.shift();
      
      let roomName = `ethio_room_${player1.id}_${player2.id}`;
      io.to(player1.id).emit('matchFound', { room: roomName, color: 'white' });
      io.to(player2.id).emit('matchFound', { room: roomName, color: 'black' });
    }
  });

  socket.on('disconnect', () => {
    tournamentPlayers = tournamentPlayers.filter(p => p.id !== socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Ethio Chess Server running on port ${PORT}`);
});
