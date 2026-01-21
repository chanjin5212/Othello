import type { GameState, Player, Position } from '../types/game';
import { Cell } from './Cell';

interface GameBoardProps {
    gameState: GameState;
    player: Player;
    onMove: (position: Position) => void;
}

export function GameBoard({ gameState, player, onMove }: GameBoardProps) {
    const isMyTurn = gameState.currentTurn === player.color;

    const isValidMove = (row: number, col: number): boolean => {
        return gameState.validMoves.some(move => move.row === row && move.col === col);
    };

    return (
        <div className="card p-8">
            <div className="grid grid-cols-8 gap-1 bg-green-950 p-2 rounded-xl shadow-2xl">
                {gameState.board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <Cell
                            key={`${rowIndex}-${colIndex}`}
                            state={cell}
                            position={{ row: rowIndex, col: colIndex }}
                            isValidMove={isValidMove(rowIndex, colIndex)}
                            onCellClick={onMove}
                            isMyTurn={isMyTurn}
                        />
                    ))
                )}
            </div>

            {gameState.validMoves.length === 0 && !gameState.gameOver && (
                <div className="mt-4 text-center text-yellow-400 font-semibold">
                    No valid moves available. Turn passes to opponent.
                </div>
            )}
        </div>
    );
}
