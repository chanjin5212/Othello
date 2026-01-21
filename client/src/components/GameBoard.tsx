import type { GameState, Player, Position } from '../types/game';
import { Cell } from './Cell';

interface GameBoardProps {
    gameState: GameState;
    player: Player;
    onMove: (position: Position) => void;
    isManualOpening: boolean;
}

export function GameBoard({ gameState, player, onMove, isManualOpening }: GameBoardProps) {
    const isAiTurn = gameState.currentTurn !== player.color;
    const isOpeningState = isManualOpening && isAiTurn && (gameState.blackCount + gameState.whiteCount === 4);
    const canMove = (gameState.currentTurn === player.color) || isOpeningState;

    const isValidMove = (row: number, col: number): boolean => {
        return gameState.validMoves.some(move => move.row === row && move.col === col);
    };

    return (
        <div className="w-full h-full p-2 bg-[#2a2a2a] rounded-lg shadow-2xl border-4 border-[#1a1a1a]">
            {/* Board Background (Felt texture effect) */}
            <div className="w-full h-full bg-[#1e5836] rounded border border-[#0f2e1b] relative overflow-hidden grid grid-cols-8 grid-rows-8 gap-[2px] p-[2px] shadow-inner">
                {/* Board grid lines are created by the gap */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] z-10 rounded" />

                {gameState.board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <div key={`${rowIndex}-${colIndex}`} className="relative bg-[#266843]">
                            <Cell
                                state={cell}
                                position={{ row: rowIndex, col: colIndex }}
                                isValidMove={isValidMove(rowIndex, colIndex)}
                                onCellClick={onMove}
                                isMyTurn={canMove}
                            />
                            {/* Previous Move Marker Logic could go here */}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
