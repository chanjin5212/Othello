import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ServerToClientEvents, ClientToServerEvents, Position } from './types.js';
import { RoomManager } from './roomManager.js';
import { makeMove, countPieces, checkGameOver, getNextPlayer, getValidMoves } from './gameLogic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.CLIENT_URL || '*'
            : 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

const roomManager = new RoomManager();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientBuildPath));

    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('joinGame', (nickname: string) => {
        console.log(`${socket.id} joining game as ${nickname}`);

        const player = {
            id: socket.id,
            nickname,
            color: 'black' as const, // Will be assigned properly in roomManager
            ready: false
        };

        const { room, matched } = roomManager.joinWaitingRoom(player);

        if (matched && room.players.length === 2) {
            // Both players matched
            const [player1, player2] = room.players;

            // Join socket room
            socket.join(room.id);
            const otherSocket = io.sockets.sockets.get(player1.id === socket.id ? player2.id : player1.id);
            otherSocket?.join(room.id);

            // Notify both players (but don't start game yet - wait for ready)
            io.to(player1.id).emit('matched', {
                roomId: room.id,
                player: player1,
                opponent: player2
            });

            io.to(player2.id).emit('matched', {
                roomId: room.id,
                player: player2,
                opponent: player1
            });
        } else {
            // Waiting for opponent
            socket.join(room.id);
            console.log(`${nickname} is waiting for an opponent in room ${room.id}`);
        }
    });

    socket.on('playerReady', (ready: boolean) => {
        const { room, allReady } = roomManager.setPlayerReady(socket.id, ready);

        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }

        // Broadcast ready state change to both players
        io.to(room.id).emit('readyStateChanged', {
            playerId: socket.id,
            ready
        });

        // If all players are ready, start the game
        if (allReady && room.gameState) {
            io.to(room.id).emit('gameStart', room.gameState);
        }
    });

    socket.on('makeMove', (position: Position) => {
        const room = roomManager.getRoomByPlayerId(socket.id);

        if (!room || !room.gameState) {
            socket.emit('error', 'Game not found');
            return;
        }

        const player = room.players.find(p => p.id === socket.id);
        if (!player) {
            socket.emit('error', 'Player not found');
            return;
        }

        // Check if it's the player's turn
        if (room.gameState.currentTurn !== player.color) {
            socket.emit('error', 'Not your turn');
            return;
        }

        try {
            // Make the move
            const newBoard = makeMove(room.gameState.board, position.row, position.col, player.color);
            const { black, white } = countPieces(newBoard);

            // Get next player
            const nextPlayer = getNextPlayer(newBoard, player.color);

            // Check if game is over
            const { gameOver, winner } = checkGameOver(newBoard, nextPlayer);

            // Update game state
            room.gameState = {
                board: newBoard,
                currentTurn: nextPlayer,
                blackCount: black,
                whiteCount: white,
                validMoves: getValidMoves(newBoard, nextPlayer),
                gameOver,
                winner
            };

            roomManager.updateGameState(room.id, room.gameState);

            // Broadcast updated game state to all players in the room
            io.to(room.id).emit('gameUpdate', room.gameState);

        } catch (error) {
            socket.emit('error', error instanceof Error ? error.message : 'Invalid move');
        }
    });

    socket.on('leaveGame', () => {
        handleDisconnect(socket.id);
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        handleDisconnect(socket.id);
    });

    function handleDisconnect(playerId: string) {
        const room = roomManager.removePlayer(playerId);

        if (room && room.status === 'playing') {
            // Notify the other player
            io.to(room.id).emit('opponentDisconnected');
        }
    }
});

// Cleanup old rooms every 5 minutes
setInterval(() => {
    roomManager.cleanupOldRooms();
}, 5 * 60 * 1000);

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
