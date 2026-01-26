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
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={handleClick}
        >
            {/* Wall (Obstacle) */}
            {state === 'wall' && (
                <div className="w-full h-full p-1">
                    <div className="w-full h-full bg-stone-800/90 rounded-md border border-stone-600 shadow-inner bg-gradient-to-br from-stone-700 to-stone-900" />
                </div>
            )}

            {/* Othello Piece (3D Effect) */}
            {(state === 'black' || state === 'white') && (
                <div
                    className={`
                        w-[85%] h-[85%] rounded-full shadow-lg transition-transform duration-300 transform scale-100 ease-out
                        ${state === 'black'
                            ? 'bg-gradient-to-br from-gray-700 via-black to-black shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),2px_2px_5px_rgba(0,0,0,0.5)]'
                            : 'bg-gradient-to-br from-white via-gray-100 to-gray-300 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.1),2px_2px_5px_rgba(0,0,0,0.3)]'
                        }
                    `}
                />
            )}

            {/* Valid Move Indicator (Hint) */}
            {isValidMove && isMyTurn && state === 'empty' && (
                <div className="w-[30%] h-[30%] bg-black/20 rounded-full ring-2 ring-white/30 animate-pulse" />
            )}
        </div>
    );
}
