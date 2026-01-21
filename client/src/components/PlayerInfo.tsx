import type { Player } from '../types/game';

interface PlayerInfoProps {
    player: Player;
    isOpponent: boolean;
    isActive: boolean;
    score: number;
}

export function PlayerInfo({ player, isOpponent, isActive, score }: PlayerInfoProps) {
    const isBlack = player.color === 'black';

    return (
        <div
            className={`
                relative flex items-center justify-between p-3 rounded-2xl transition-all duration-300
                ${isActive
                    ? 'bg-slate-800 border-2 border-primary-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] transform scale-102'
                    : 'bg-slate-800/50 border-2 border-transparent opacity-80'
                }
            `}
        >
            {/* Player Identity Section */}
            <div className="flex items-center gap-3">
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center shadow-inner
                    ${isBlack
                        ? 'bg-gradient-to-br from-gray-800 to-black ring-2 ring-gray-600'
                        : 'bg-gradient-to-br from-gray-100 to-gray-300 ring-2 ring-gray-400'
                    }
                `}>
                    <div className={`w-3/4 h-3/4 rounded-full ${isBlack ? 'bg-black' : 'bg-white'} shadow-md`} />
                </div>

                <div className="flex flex-col">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-primary-400' : 'text-gray-500'}`}>
                        {isOpponent ? 'OPPONENT' : 'YOU'}
                    </span>
                    <span className="font-bold text-white text-lg truncate max-w-[120px]">
                        {player.nickname}
                    </span>
                </div>
            </div>

            {/* Turn Indicator & Score */}
            <div className="flex items-center gap-4">
                {isActive && (
                    <div className="px-2 py-0.5 rounded bg-primary-500/20 text-primary-400 text-xs font-bold animate-pulse">
                        TURN
                    </div>
                )}
                <div className="flex flex-col items-end">
                    <span className="text-3xl font-black text-white leading-none font-mono">
                        {String(score).padStart(2, '0')}
                    </span>
                </div>
            </div>
        </div>
    );
}
