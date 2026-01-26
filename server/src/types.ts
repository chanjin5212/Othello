// Game types
export type CellState = 'empty' | 'black' | 'white' | 'wall';
export type PlayerColor = 'black' | 'white';
export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'finished';

export interface Position {
    row: number;
    col: number;
}

export interface Player {
    id: string;
    nickname: string;
    color: PlayerColor;
    ready: boolean;
}

export interface GameState {
    board: CellState[][];
    currentTurn: PlayerColor;
    blackCount: number;
    whiteCount: number;
    validMoves: Position[];
    gameOver: boolean;
    winner: PlayerColor | 'draw' | null;
}

export interface Room {
    id: string;
    status: RoomStatus;
    players: Player[];
    gameState: GameState | null;
    createdAt: number;
}

// Socket event types
export interface ServerToClientEvents {
    'matched': (data: { roomId: string; player: Player; opponent: Player }) => void;
    'gameStart': (gameState: GameState) => void;
    'gameUpdate': (gameState: GameState) => void;
    'opponentDisconnected': () => void;
    'readyStateChanged': (data: { playerId: string; ready: boolean }) => void;
    'error': (message: string) => void;
}

export interface ClientToServerEvents {
    'joinGame': (nickname: string) => void;
    'playerReady': (ready: boolean) => void;
    'makeMove': (position: Position) => void;
    'leaveGame': () => void;
}
