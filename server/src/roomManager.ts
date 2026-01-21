import type { Room, Player, PlayerColor } from './types.js';
import { createInitialGameState } from './gameLogic.js';

export class RoomManager {
    private rooms: Map<string, Room> = new Map();
    private playerRooms: Map<string, string> = new Map(); // playerId -> roomId
    private waitingRoom: string | null = null;

    createRoom(player: Player): Room {
        const roomId = this.generateRoomId();
        const room: Room = {
            id: roomId,
            status: 'waiting',
            players: [player],
            gameState: null,
            createdAt: Date.now()
        };

        this.rooms.set(roomId, room);
        this.playerRooms.set(player.id, roomId);
        this.waitingRoom = roomId;

        return room;
    }

    joinWaitingRoom(player: Player): { room: Room; matched: boolean } {
        // Check if there's a waiting room
        if (this.waitingRoom && this.rooms.has(this.waitingRoom)) {
            const room = this.rooms.get(this.waitingRoom)!;

            if (room.players.length === 1 && room.status === 'waiting') {
                // Assign colors randomly
                const firstPlayerColor: PlayerColor = Math.random() < 0.5 ? 'black' : 'white';
                const secondPlayerColor: PlayerColor = firstPlayerColor === 'black' ? 'white' : 'black';

                room.players[0].color = firstPlayerColor;
                room.players[0].ready = false;
                player.color = secondPlayerColor;
                player.ready = false;
                room.players.push(player);

                // Change status to ready (waiting for both players to ready up)
                room.status = 'ready';

                this.playerRooms.set(player.id, room.id);
                this.waitingRoom = null;

                return { room, matched: true };
            }
        }

        // Create a new waiting room
        player.ready = false;
        const room = this.createRoom(player);
        return { room, matched: false };
    }

    setPlayerReady(playerId: string, ready: boolean): { room: Room | undefined; allReady: boolean } {
        const room = this.getRoomByPlayerId(playerId);
        if (!room) return { room: undefined, allReady: false };

        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.ready = ready;
        }

        // Check if all players are ready
        const allReady = room.players.length === 2 && room.players.every(p => p.ready);

        // If all players are ready, start the game
        if (allReady && room.status === 'ready') {
            room.status = 'playing';
            room.gameState = createInitialGameState();
        }

        return { room, allReady };
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    getRoomByPlayerId(playerId: string): Room | undefined {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId) return undefined;
        return this.rooms.get(roomId);
    }

    removePlayer(playerId: string): Room | undefined {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId) return undefined;

        const room = this.rooms.get(roomId);
        if (!room) return undefined;

        // Remove player from room
        room.players = room.players.filter(p => p.id !== playerId);
        this.playerRooms.delete(playerId);

        // If room is empty or only one player left in a playing/ready game, delete the room
        if (room.players.length === 0 || ((room.status === 'playing' || room.status === 'ready') && room.players.length === 1)) {
            this.rooms.delete(roomId);
            if (this.waitingRoom === roomId) {
                this.waitingRoom = null;
            }
        }

        return room;
    }

    updateGameState(roomId: string, gameState: any): void {
        const room = this.rooms.get(roomId);
        if (room) {
            room.gameState = gameState;
        }
    }

    private generateRoomId(): string {
        return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Cleanup old waiting rooms (optional, for production)
    cleanupOldRooms(maxAge: number = 30 * 60 * 1000): void {
        const now = Date.now();
        for (const [roomId, room] of this.rooms.entries()) {
            if (room.status === 'waiting' && now - room.createdAt > maxAge) {
                this.rooms.delete(roomId);
                if (this.waitingRoom === roomId) {
                    this.waitingRoom = null;
                }
            }
        }
    }
}
