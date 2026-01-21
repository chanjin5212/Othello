import type { GameState, Player } from '../types/game';

interface GameResultProps {
    gameState: GameState;
    player: Player;
    onPlayAgain: () => void;
}

export function GameResult({ gameState, player, onPlayAgain }: GameResultProps) {
    if (!gameState.gameOver) return null;

    const getResultMessage = () => {
        if (gameState.winner === 'draw') {
            return {
                title: "It's a Draw! 🤝",
                message: `Both players have ${gameState.blackCount} pieces`,
                color: 'text-yellow-400'
            };
        }

        const didIWin = gameState.winner === player.color;

        if (didIWin) {
            return {
                title: 'You Won! 🎉',
                message: `${gameState.winner === 'black' ? gameState.blackCount : gameState.whiteCount} - ${gameState.winner === 'black' ? gameState.whiteCount : gameState.blackCount}`,
                color: 'text-green-400'
            };
        }

        return {
            title: 'You Lost 😔',
            message: `${gameState.winner === 'black' ? gameState.blackCount : gameState.whiteCount} - ${gameState.winner === 'black' ? gameState.whiteCount : gameState.blackCount}`,
            color: 'text-red-400'
        };
    };

    const result = getResultMessage();

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card p-8 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <h2 className={`text-4xl font-bold ${result.color}`}>
                    {result.title}
                </h2>

                <div className="space-y-2">
                    <p className="text-2xl font-semibold text-gray-300">
                        Final Score
                    </p>
                    <p className="text-3xl font-bold">
                        {result.message}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="game-piece black w-8 h-8" />
                            <span className="font-semibold">Black</span>
                        </div>
                        <p className="text-3xl font-bold">{gameState.blackCount}</p>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="game-piece white w-8 h-8" />
                            <span className="font-semibold">White</span>
                        </div>
                        <p className="text-3xl font-bold">{gameState.whiteCount}</p>
                    </div>
                </div>

                <button
                    onClick={onPlayAgain}
                    className="btn-primary w-full"
                >
                    Play Again
                </button>
            </div>
        </div>
    );
}
