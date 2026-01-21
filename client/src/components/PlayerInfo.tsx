import type { Player, PlayerColor } from '../types/game';

interface PlayerInfoProps {
    player: Player;
    opponent: Player;
    currentTurn: PlayerColor;
    blackCount: number;
    whiteCount: number;
}

export function PlayerInfo({ player, opponent, currentTurn, blackCount, whiteCount }: PlayerInfoProps) {
    const isMyTurn = currentTurn === player.color;

    return (
        <div className="space-y-4">
            {/* Your Info */}
            <div className={`card p-6 ${isMyTurn ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400">You</p>
                        <p className="text-xl font-bold">{player.nickname}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`game-piece ${player.color} w-12 h-12`} />
                        <p className="text-3xl font-bold">
                            {player.color === 'black' ? blackCount : whiteCount}
                        </p>
                    </div>
                </div>
                {isMyTurn && (
                    <div className="mt-3 text-sm text-primary-400 font-semibold animate-pulse">
                        ⚡ Your turn!
                    </div>
                )}
            </div>

            {/* Opponent Info */}
            <div className={`card p-6 ${!isMyTurn ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400">Opponent</p>
                        <p className="text-xl font-bold">{opponent.nickname}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`game-piece ${opponent.color} w-12 h-12`} />
                        <p className="text-3xl font-bold">
                            {opponent.color === 'black' ? blackCount : whiteCount}
                        </p>
                    </div>
                </div>
                {!isMyTurn && (
                    <div className="mt-3 text-sm text-gray-400">
                        Opponent's turn...
                    </div>
                )}
            </div>
        </div>
    );
}
