import type { CellState, PlayerColor, Position } from '../types/game';

const BOARD_SIZE = 8;

// AI를 위한 게임 로직 유틸리티
export function getValidMovesForAI(
    board: CellState[][],
    player: PlayerColor
): Position[] {
    const validMoves: Position[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isValidMoveAI(board, row, col, player)) {
                validMoves.push({ row, col });
            }
        }
    }

    return validMoves;
}

function isValidMoveAI(
    board: CellState[][],
    row: number,
    col: number,
    player: PlayerColor
): boolean {
    if (board[row][col] !== 'empty') return false;

    const opponent: PlayerColor = player === 'black' ? 'white' : 'black';
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (const [dx, dy] of directions) {
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

// AI 이동 계산 - Minimax 알고리즘 간소화 버전
export function calculateAIMove(
    board: CellState[][],
    aiColor: PlayerColor,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Position | null {
    const validMoves = getValidMovesForAI(board, aiColor);

    if (validMoves.length === 0) return null;

    if (difficulty === 'easy') {
        // 쉬움: 랜덤 선택
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    if (difficulty === 'medium') {
        // 보통: 가장 많은 돌을 뒤집는 수 선택
        let bestMove = validMoves[0];
        let maxFlips = 0;

        for (const move of validMoves) {
            const flips = countFlipsForMove(board, move.row, move.col, aiColor);
            if (flips > maxFlips) {
                maxFlips = flips;
                bestMove = move;
            }
        }

        return bestMove;
    }

    // 어려움: 전략적 위치 우선 + 최대 뒤집기
    return calculateStrategicMove(board, validMoves, aiColor);
}

function countFlipsForMove(
    board: CellState[][],
    row: number,
    col: number,
    player: PlayerColor
): number {
    const opponent: PlayerColor = player === 'black' ? 'white' : 'black';
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    let totalFlips = 0;

    for (const [dx, dy] of directions) {
        const toFlip: Position[] = [];
        let x = row + dx;
        let y = col + dy;

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            if (board[x][y] === 'empty') break;
            if (board[x][y] === opponent) {
                toFlip.push({ row: x, col: y });
            } else if (board[x][y] === player) {
                totalFlips += toFlip.length;
                break;
            }
            x += dx;
            y += dy;
        }
    }

    return totalFlips;
}

function calculateStrategicMove(
    board: CellState[][],
    validMoves: Position[],
    aiColor: PlayerColor
): Position {
    // 전략적 위치 가중치 (모서리가 가장 중요)
    const positionWeights: number[][] = [
        [100, -20, 10, 5, 5, 10, -20, 100],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [10, -2, 10, 1, 1, 10, -2, 10],
        [5, -2, 1, 1, 1, 1, -2, 5],
        [5, -2, 1, 1, 1, 1, -2, 5],
        [10, -2, 10, 1, 1, 10, -2, 10],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [100, -20, 10, 5, 5, 10, -20, 100]
    ];

    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
        const flips = countFlipsForMove(board, move.row, move.col, aiColor);
        const positionWeight = positionWeights[move.row][move.col];
        // 위치 가중치 + 뒤집는 돌 수
        const score = positionWeight * 2 + flips;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}
