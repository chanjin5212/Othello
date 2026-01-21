import type { CellState, Position } from '../types/game';

interface CellProps {
    state: CellState;
    position: Position;
    isValidMove: boolean;
    onCellClick: (position: Position) => void;
    isMyTurn: boolean;
}

export function Cell({ state, position, isValidMove, onCellClick, isMyTurn }: CellProps) {
    const handleClick = () => {
        if (isValidMove && isMyTurn) {
            onCellClick(position);
        }
    };

    return (
        <div
            className={`game-cell ${isValidMove && isMyTurn ? 'valid-move' : ''}`}
            onClick={handleClick}
        >
            {state !== 'empty' && (
                <div className={`game-piece ${state} animate-flip`} />
            )}
            {isValidMove && isMyTurn && state === 'empty' && (
                <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-70" />
            )}
        </div>
    );
}
