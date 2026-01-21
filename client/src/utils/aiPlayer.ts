import type { CellState, PlayerColor, Position } from '../types/game';

const BOARD_SIZE = 8;

// 보드 복사 헬퍼
function cloneBoard(board: CellState[][]): CellState[][] {
    return board.map(row => [...row]);
}

// 유효한 수 찾기
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

// 수 실행 (가상 보드용)
function makeMoveSimulate(board: CellState[][], row: number, col: number, player: PlayerColor): CellState[][] {
    const newBoard = cloneBoard(board);
    newBoard[row][col] = player;

    const opponent: PlayerColor = player === 'black' ? 'white' : 'black';
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (const [dx, dy] of directions) {
        const toFlip: Position[] = [];
        let x = row + dx;
        let y = col + dy;

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            if (newBoard[x][y] === 'empty') break;
            if (newBoard[x][y] === opponent) {
                toFlip.push({ row: x, col: y });
            } else if (newBoard[x][y] === player) {
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

// --- 고급 평가 함수 및 Minimax 알고리즘 ---

// 정적 가중치 (위치 가치)
const WEIGHTS = [
    [120, -20, 20, 5, 5, 20, -20, 120],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [20, -5, 15, 3, 3, 15, -5, 20],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [20, -5, 15, 3, 3, 15, -5, 20],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [120, -20, 20, 5, 5, 20, -20, 120]
];

function evaluateBoard(board: CellState[][], aiColor: PlayerColor): number {
    let score = 0;
    const opponentColor = aiColor === 'black' ? 'white' : 'black';

    let aiPieces = 0;
    let opPieces = 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = board[r][c];
            if (cell === aiColor) {
                score += WEIGHTS[r][c];
                aiPieces++;
            } else if (cell === opponentColor) {
                score -= WEIGHTS[r][c];
                opPieces++;
            }

            if (cell !== 'empty') {
                // Frontier discs check (빈 칸 옆에 있는 돌은 공격받기 쉬움 - 감점 요인)
                // (간단 구현을 위해 생략하거나 나중에 정교화 가능)
            }
        }
    }

    // 기동성 (Mobility): 내가 둘 수 있는 곳이 많고, 상대가 둘 곳이 적을수록 좋음
    const aiMoves = getValidMovesForAI(board, aiColor).length;
    const opMoves = getValidMovesForAI(board, opponentColor).length;

    // Mobility 가중치 (매우 중요)
    score += (aiMoves - opMoves) * 15;

    // 게임 후반부에는 돌 개수가 중요해짐 (끝내기)
    if (aiPieces + opPieces > 50) {
        score += (aiPieces - opPieces) * 2;
    }

    return score;
}

// Minimax with Alpha-Beta Pruning
function minimax(
    board: CellState[][],
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: boolean,
    aiColor: PlayerColor
): number {
    if (depth === 0) {
        return evaluateBoard(board, aiColor);
    }

    const currentPlayer = maximizingPlayer ? aiColor : (aiColor === 'black' ? 'white' : 'black');
    const validMoves = getValidMovesForAI(board, currentPlayer);

    // 둘 곳이 없는 경우 (Pass)
    if (validMoves.length === 0) {
        // 상대방도 둘 곳이 없으면 게임 종료 -> 최종 점수 계산
        const opponent = currentPlayer === 'black' ? 'white' : 'black';
        if (getValidMovesForAI(board, opponent).length === 0) {
            // 게임 종료 상황: 많이 먹은 쪽이 승리 (큰 점수 부여)
            let aiCount = 0, opCount = 0;
            board.flat().forEach(c => {
                if (c === aiColor) aiCount++;
                else if (c === (aiColor === 'black' ? 'white' : 'black')) opCount++;
            });
            return aiCount > opCount ? 10000 : -10000;
        }
        // 상대방 턴으로 넘겨서 계속 탐색
        return minimax(board, depth - 1, alpha, beta, !maximizingPlayer, aiColor);
    }

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of validMoves) {
            const newBoard = makeMoveSimulate(board, move.row, move.col, aiColor);
            const ev = minimax(newBoard, depth - 1, alpha, beta, false, aiColor);
            maxEval = Math.max(maxEval, ev);
            alpha = Math.max(alpha, ev);
            if (beta <= alpha) break; // Beta Cut-off
        }
        return maxEval;
    } else {
        const opponentColor = aiColor === 'black' ? 'white' : 'black';
        let minEval = Infinity;
        for (const move of validMoves) {
            const newBoard = makeMoveSimulate(board, move.row, move.col, opponentColor);
            const ev = minimax(newBoard, depth - 1, alpha, beta, true, aiColor);
            minEval = Math.min(minEval, ev);
            beta = Math.min(beta, ev);
            if (beta <= alpha) break; // Alpha Cut-off
        }
        return minEval;
    }
}

export function calculateAIMove(
    board: CellState[][],
    aiColor: PlayerColor,
    difficulty: 'easy' | 'medium' | 'hard'
): Position | null {
    const validMoves = getValidMovesForAI(board, aiColor);
    if (validMoves.length === 0) return null;

    // 쉬움: 완전 랜덤은 아니고 가중치만 봄 (Minimax 안씀)
    if (difficulty === 'easy') {
        // 하위 50% 수 중에서 랜덤 or 가장자리만 피하기 정도의 수준
        // 공부용으로는 너무 멍청하면 안되니, 그냥 Greedy(가장 많이 뒤집는 수)로 변경할 수도 있으나
        // 요청하신 '똑똑하게'에 맞춰 easy도 어느정도 생각은 하되 깊이를 1로 설정
        let bestMove = validMoves[0];
        let maxEval = -Infinity;
        for (const move of validMoves) {
            const newBoard = makeMoveSimulate(board, move.row, move.col, aiColor);
            // 깊이 0 (현재 상태 평가만)
            const ev = evaluateBoard(newBoard, aiColor);
            // 약간의 랜덤성 추가
            const randomFactor = Math.random() * 20 - 10;
            if (ev + randomFactor > maxEval) {
                maxEval = ev + randomFactor;
                bestMove = move;
            }
        }
        return bestMove;
    }

    // 보통/어려움: Minimax 깊이 차이
    // 보통: 2~3수 앞
    // 어려움: 4~5수 앞 (웹 브라우저 성능 고려)
    const depth = difficulty === 'medium' ? 3 : 5;

    let bestMove = validMoves[0];
    let maxEval = -Infinity;

    // Root 레벨에서의 탐색
    for (const move of validMoves) {
        const newBoard = makeMoveSimulate(board, move.row, move.col, aiColor);
        // 내 턴이 끝났으니 상대방(minimizing) 차례부터 시작
        const ev = minimax(newBoard, depth - 1, -Infinity, Infinity, false, aiColor);

        if (ev > maxEval) {
            maxEval = ev;
            bestMove = move;
        }
    }

    return bestMove;
}
