import { useState } from 'react';

type GameMode = 'multiplayer' | 'ai';
type PlayerColor = 'black' | 'white';

interface LobbyProps {
    onJoinGame: (nickname: string) => void;
    onStartAI: (nickname: string, difficulty: 'easy' | 'medium' | 'hard', playerColor: PlayerColor, manualOpening: boolean) => void;
    isWaiting: boolean;
}

export function Lobby({ onJoinGame, onStartAI, isWaiting }: LobbyProps) {
    const [nickname, setNickname] = useState('');
    const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [myColor, setMyColor] = useState<PlayerColor>('black');
    const [manualOpening, setManualOpening] = useState(false);

    const handleMultiplayerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nickname.trim()) {
            onJoinGame(nickname.trim());
        }
    };

    const handleAIStart = () => {
        if (nickname.trim()) {
            onStartAI(nickname.trim(), difficulty, myColor, manualOpening);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card p-8 max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                        오델로
                    </h1>
                    <p className="text-gray-400">멀티플레이어 온라인 게임</p>
                </div>

                {!selectedMode ? (
                    /* 모드 선택 화면 */
                    <div className="space-y-4">
                        <p className="text-center text-gray-300 font-medium">게임 모드를 선택하세요</p>

                        <button
                            onClick={() => setSelectedMode('multiplayer')}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                            👥 멀티플레이어
                        </button>

                        <button
                            onClick={() => setSelectedMode('ai')}
                            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                            🤖 AI 대전
                        </button>
                    </div>
                ) : selectedMode === 'multiplayer' ? (
                    /* 멀티플레이어 모드 */
                    !isWaiting ? (
                        <div className="space-y-4">
                            <button
                                onClick={() => setSelectedMode(null)}
                                className="text-sm text-gray-400 hover:text-white"
                            >
                                ← 뒤로 가기
                            </button>

                            <form onSubmit={handleMultiplayerSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
                                        닉네임을 입력하세요
                                    </label>
                                    <input
                                        type="text"
                                        id="nickname"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg 
                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent 
                                 text-white placeholder-gray-400 transition-all"
                                        placeholder="플레이어 이름"
                                        maxLength={20}
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!nickname.trim()}
                                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    🎮 게임 시작
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="text-center space-y-6 py-8">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>

                            <div className="space-y-2">
                                <p className="text-2xl font-bold text-primary-400">
                                    상대를 찾는 중...
                                </p>
                                <p className="text-sm text-gray-400">
                                    잠시만 기다려주세요
                                </p>
                            </div>

                            <button
                                onClick={() => { setSelectedMode(null); window.location.reload(); }}
                                className="text-sm text-gray-400 hover:text-white"
                            >
                                취소
                            </button>
                        </div>
                    )
                ) : (
                    /* AI 대전 모드 */
                    <div className="space-y-5">
                        <button
                            onClick={() => setSelectedMode(null)}
                            className="text-sm text-gray-400 hover:text-white"
                        >
                            ← 뒤로 가기
                        </button>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                학습자(플레이어) 닉네임
                            </label>
                            <input
                                type="text"
                                id="ai-nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg 
                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent 
                                 text-white placeholder-gray-400 transition-all"
                                placeholder="이름 입력"
                                maxLength={20}
                            />
                        </div>

                        {/* 내 색깔 선택 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                무엇으로 플레이 하시겠습니까?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMyColor('black')}
                                    className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border-2 ${myColor === 'black'
                                        ? 'bg-slate-800 border-primary-500 shadow-lg shadow-primary-500/20'
                                        : 'bg-slate-800 border-transparent opacity-50 hover:opacity-100'
                                        }`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-black border border-gray-700" />
                                    <span className="text-white font-bold">오델로(흑)</span>
                                    {myColor === 'black' && <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full ml-1">선공</span>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMyColor('white')}
                                    className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border-2 ${myColor === 'white'
                                        ? 'bg-slate-800 border-primary-500 shadow-lg shadow-primary-500/20'
                                        : 'bg-slate-800 border-transparent opacity-50 hover:opacity-100'
                                        }`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-white border border-gray-300" />
                                    <span className="text-white font-bold">오델로(백)</span>
                                </button>
                            </div>
                        </div>

                        {/* 오프닝 직접 설정 (AI가 흑일 때만) */}
                        {myColor === 'white' && (
                            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                <input
                                    type="checkbox"
                                    id="manual-opening"
                                    checked={manualOpening}
                                    onChange={(e) => setManualOpening(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-500 text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="manual-opening" className="text-sm text-gray-300 cursor-pointer">
                                    <span className="font-bold text-white">오프닝 직접 설정</span>
                                    <p className="text-xs text-gray-500">AI(흑)의 첫 수를 내가 대신 둡니다.</p>
                                </label>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                AI 난이도
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDifficulty('easy')}
                                    className={`py-2 px-4 rounded-lg font-medium transition-all ${difficulty === 'easy'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                        }`}
                                >
                                    쉬움
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDifficulty('medium')}
                                    className={`py-2 px-4 rounded-lg font-medium transition-all ${difficulty === 'medium'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                        }`}
                                >
                                    보통
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDifficulty('hard')}
                                    className={`py-2 px-4 rounded-lg font-medium transition-all ${difficulty === 'hard'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                        }`}
                                >
                                    어려움
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleAIStart}
                            disabled={!nickname.trim()}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            🎓 공부 시작
                        </button>
                    </div>
                )}

                <div className="pt-6 border-t border-slate-700">
                    <h3 className="font-semibold mb-3 text-gray-300">게임 방법</h3>
                    <ul className="text-sm text-gray-400 space-y-2">
                        <li>• 상대방의 돌을 뒤집을 수 있는 곳에 돌을 놓으세요</li>
                        <li>• 한 번에 최소 1개 이상의 돌을 뒤집어야 합니다</li>
                        <li>• 가장 많은 돌을 가진 플레이어가 승리합니다</li>
                        <li>• 양쪽 모두 둘 곳이 없으면 게임이 종료됩니다</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
