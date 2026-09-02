const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log('ተጫዋች ተገናኝቷል:', socket.id);

    socket.on('joinTournament', () => {
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            // ሁለት ተጫዋች ሲኖር ጨዋታ ማስጀመር
            let gameId = 'game_' + socket.id;
            
            socket.join(gameId);
            waitingPlayer.join(gameId);

            // ለሁለቱም ተጫዋቾች ቀለማቸውንና ጨዋታውን መላክ
            waitingPlayer.emit('gameStart', { color: 'w', gameId: gameId });
            socket.emit('gameStart', { color: 'b', gameId: gameId });

            waitingPlayer = null;
        } else {
            // ተጫዋች መጠበቅ
            waitingPlayer = socket;
            socket.emit('waiting', 'ተቃራኒ ተጫዋች እየተፈለገ ነው...');
        }
    });

    // የእንቅስቃሴ መረጃዎችን ለተቃራኒ ማስተላለፍ
    socket.on('makeMove', (data) => {
        socket.to(data.gameId).emit('opponentMove', data.move);
    });

    socket.on('disconnect', () => {
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
        }
        console.log('ተጫዋች ወጥቷል:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
