import { useState } from 'react';
import type { Player } from '../types/game';

interface ReadyRoomProps {
    player: Player;
    opponent: Player;
    onReady: (ready: boolean) => void;
}

export function ReadyRoom({ player, opponent, onReady }: ReadyRoomProps) {
    const [myReady, setMyReady] = useState(player.ready);

    const handleReadyClick = () => {
        const newReady = !myReady;
        setMyReady(newReady);
        onReady(newReady);
    };

    const allReady = myReady && opponent.ready;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card p-8 max-w-2xl w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">매칭 완료!</h2>
                    <p className="text-gray-400">준비가 되면 준비 완료를 눌러주세요</p>
                </div>

                {/* Players */}
                <div className="grid grid-cols-2 gap-6">
                    {/* You */}
                    <div className={`card p-6 text-center ${myReady ? 'border-2 border-green-500' : 'border-2 border-gray-600'}`}>
                        <div className="mb-4">
                            <div className={`game-piece ${player.color} w-20 h-20 mx-auto`} />
                        </div>
                        <p className="text-sm text-gray-400">You</p>
                        <p className="text-xl font-bold text-white mb-2">{player.nickname}</p>
                        <p className="text-sm text-gray-300">{player.color === 'black' ? '흑' : '백'}</p>
                        {myReady && (
                            <div className="mt-3 text-green-400 font-semibold">
                                ✓ 준비 완료
                            </div>
                        )}
                        {!myReady && (
                            <div className="mt-3 text-gray-500">
                                대기 중...
                            </div>
                        )}
                    </div>

                    {/* Opponent */}
                    <div className={`card p-6 text-center ${opponent.ready ? 'border-2 border-green-500' : 'border-2 border-gray-600'}`}>
                        <div className="mb-4">
                            <div className={`game-piece ${opponent.color} w-20 h-20 mx-auto`} />
                        </div>
                        <p className="text-sm text-gray-400">Opponent</p>
                        <p className="text-xl font-bold text-white mb-2">{opponent.nickname}</p>
                        <p className="text-sm text-gray-300">{opponent.color === 'black' ? '흑' : '백'}</p>
                        {opponent.ready && (
                            <div className="mt-3 text-green-400 font-semibold">
                                ✓ 준비 완료
                            </div>
                        )}
                        {!opponent.ready && (
                            <div className="mt-3 text-gray-500">
                                대기 중...
                            </div>
                        )}
                    </div>
                </div>

                {/* Ready Button */}
                <div className="text-center space-y-4">
                    <button
                        onClick={handleReadyClick}
                        className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${myReady
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        {myReady ? '준비 취소' : '준비 완료'}
                    </button>

                    {allReady && (
                        <p className="text-xl font-bold text-green-400 animate-pulse">
                            게임 시작 중...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
