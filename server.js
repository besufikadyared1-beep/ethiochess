const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let waitingSocket = null;

io.on('connection', (socket) => {
    console.log('ተጫዋች ተገናኝቷል:', socket.id);

    socket.on('joinTournament', () => {
        if (waitingSocket && waitingSocket.id !== socket.id) {
            let roomName = 'room_' + socket.id;

            socket.join(roomName);
            waitingSocket.join(roomName);

            // ለሁለቱም ተጫዋቾች መረጃ መላክ
            waitingSocket.emit('gameStart', { color: 'w', room: roomName });
            socket.emit('gameStart', { color: 'b', room: roomName });

            waitingSocket = null;
        } else {
            waitingSocket = socket;
            socket.emit('waiting', 'ተቃራኒ ተጫዋች እየተፈለገ ነው...');
        }
    });

    socket.on('makeMove', (data) => {
        socket.to(data.room).emit('opponentMove', data.move);
    });

    socket.on('disconnect', () => {
        if (waitingSocket && waitingSocket.id === socket.id) {
            waitingSocket = null;
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
