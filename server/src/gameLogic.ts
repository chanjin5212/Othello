import type { CellState, PlayerColor, Position, GameState } from './types.js';

const BOARD_SIZE = 8;
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
];

export function createInitialBoard(): CellState[][] {
    const board: CellState[][] = Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill('empty'));

    // Initial 4 pieces in the center
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';

    return board;
}

export function createInitialGameState(): GameState {
    const board = createInitialBoard();
    return {
        board,
        currentTurn: 'black',
        blackCount: 2,
        whiteCount: 2,
        validMoves: getValidMoves(board, 'black'),
        gameOver: false,
        winner: null
    };
}

export function getValidMoves(board: CellState[][], player: PlayerColor): Position[] {
    const validMoves: Position[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === 'empty' && isValidMove(board, row, col, player)) {
                validMoves.push({ row, col });
            }
        }
    }

    return validMoves;
}

export function isValidMove(
    board: CellState[][],
    row: number,
    col: number,
    player: PlayerColor
): boolean {
    if (board[row][col] !== 'empty') return false;

    const opponent: PlayerColor = player === 'black' ? 'white' : 'black';

    for (const [dx, dy] of DIRECTIONS) {
        let x = row + dx;
        let y = col + dy;
        let hasOpponentBetween = false;

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            if (board[x][y] === 'empty') break;
            if (board[x][y] === opponent) {
                hasOpponentBetween = true;
            } else if (board[x][y] === player) {
                if (hasOpponentBetween) return true;
                break;
            }
            x += dx;
            y += dy;
        }
    }

    return false;
}

export function makeMove(
    board: CellState[][],
    row: number,
    col: number,
    player: PlayerColor
): CellState[][] {
    if (!isValidMove(board, row, col, player)) {
        throw new Error('Invalid move');
    }

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = player;

    const opponent: PlayerColor = player === 'black' ? 'white' : 'black';

    for (const [dx, dy] of DIRECTIONS) {
        const toFlip: Position[] = [];
        let x = row + dx;
        let y = col + dy;

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            if (newBoard[x][y] === 'empty') break;
            if (newBoard[x][y] === opponent) {
                toFlip.push({ row: x, col: y });
            } else if (newBoard[x][y] === player) {
                // Flip all pieces in between
                toFlip.forEach(pos => {
                    newBoard[pos.row][pos.col] = player;
                });
                break;
            }
            x += dx;
            y += dy;
        }
    }

    return newBoard;
}

export function countPieces(board: CellState[][]): { black: number; white: number } {
    let black = 0;
    let white = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === 'black') black++;
            if (board[row][col] === 'white') white++;
        }
    }

    return { black, white };
}

export function checkGameOver(
    board: CellState[][],
    currentPlayer: PlayerColor
): { gameOver: boolean; winner: PlayerColor | 'draw' | null } {
    const currentValidMoves = getValidMoves(board, currentPlayer);
    const opponent: PlayerColor = currentPlayer === 'black' ? 'white' : 'black';
    const opponentValidMoves = getValidMoves(board, opponent);

    // Game is over if neither player can move
    if (currentValidMoves.length === 0 && opponentValidMoves.length === 0) {
        const { black, white } = countPieces(board);
        let winner: PlayerColor | 'draw' | null = null;

        if (black > white) winner = 'black';
        else if (white > black) winner = 'white';
        else winner = 'draw';

        return { gameOver: true, winner };
    }

    return { gameOver: false, winner: null };
}

export function getNextPlayer(
    board: CellState[][],
    currentPlayer: PlayerColor
): PlayerColor {
    const opponent: PlayerColor = currentPlayer === 'black' ? 'white' : 'black';
    const opponentValidMoves = getValidMoves(board, opponent);

    // If opponent has valid moves, switch to opponent
    if (opponentValidMoves.length > 0) {
        return opponent;
    }

    // Otherwise, current player continues (or game is over)
    return currentPlayer;
}
