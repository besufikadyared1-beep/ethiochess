const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // ተጫዋቾችን የማገናኘት logic
    if (waitingPlayer === null) {
        waitingPlayer = socket;
        socket.emit('playerRole', 'w'); // የመጀመሪያው ተጫዋች White ይሆናል
    } else {
        let roomName = 'game_' + waitingPlayer.id + '_' + socket.id;
        
        socket.join(roomName);
        waitingPlayer.join(roomName);

        socket.emit('playerRole', 'b'); // ሁለተኛው ተጫዋች Black ይሆናል

        waitingPlayer.room = roomName;
        socket.room = roomName;

        waitingPlayer = null;
    }

    // የቦርድ እንቅስቃሴን ለተጋጣሚው ማስተላለፍ
    socket.on('move', (moveData) => {
        if (socket.room) {
            socket.to(socket.room).emit('move', moveData);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
        if (socket.room) {
            io.to(socket.room).emit('playerDisconnected');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
