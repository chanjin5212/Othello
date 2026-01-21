// Game types (matching server types)
export type CellState = 'empty' | 'black' | 'white';
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

export interface MatchData {
    roomId: string;
    player: Player;
    opponent: Player;
}
