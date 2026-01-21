import { useState, useEffect } from 'react';
import { Lobby } from './components/Lobby';
import { ReadyRoom } from './components/ReadyRoom';
import { GameBoard } from './components/GameBoard';
import { PlayerInfo } from './components/PlayerInfo';
import { GameResult } from './components/GameResult';
import { useSocket } from './hooks/useSocket';
import { calculateAIMove, getValidMovesForAI } from './utils/aiPlayer';
import type { GameState, Player, Position, CellState, PlayerColor } from './types/game';

type AppState = 'lobby' | 'waiting' | 'ready' | 'playing';
type GameMode = 'multiplayer' | 'ai';

function App() {
  const [appState, setAppState] = useState<AppState>('lobby');
  const [gameMode, setGameMode] = useState<GameMode>('multiplayer');
  const [player, setPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const { isConnected, joinGame, playerReady, makeMove, on, off } = useSocket();

  // AI 모드일 때 AI 턴 처리
  useEffect(() => {
    if (gameMode === 'ai' && gameState && !gameState.gameOver && appState === 'playing') {
      const aiColor: PlayerColor = opponent?.color || 'white';

      if (gameState.currentTurn === aiColor) {
        // AI 턴 - 1초 후에 수를 둠 (생각하는 시간)
        const timeout = setTimeout(() => {
          const aiMove = calculateAIMove(gameState.board, aiColor, aiDifficulty);
          if (aiMove) {
            handleAIMove(aiMove);
          }
        }, 1000);

        return () => clearTimeout(timeout);
      }
    }
  }, [gameState, gameMode, appState, opponent?.color, aiDifficulty]);

  // 멀티플레이어 이벤트 핸들러
  useEffect(() => {
    if (gameMode !== 'multiplayer') return;

    const handleMatched = (data: any) => {
      console.log('Matched with opponent:', data);
      setPlayer(data.player);
      setOpponent(data.opponent);
      setAppState('ready');
    };

    const handleReadyStateChanged = (data: { playerId: string; ready: boolean }) => {
      console.log('Ready state changed:', data);
      if (data.playerId === player?.id) {
        setPlayer(prev => prev ? { ...prev, ready: data.ready } : null);
      } else {
        setOpponent(prev => prev ? { ...prev, ready: data.ready } : null);
      }
    };

    const handleGameStart = (state: GameState) => {
      console.log('Game started:', state);
      setGameState(state);
      setAppState('playing');
    };

    const handleGameUpdate = (state: GameState) => {
      console.log('Game updated:', state);
      setGameState(state);
    };

    const handleOpponentDisconnected = () => {
      alert('상대방이 연결을 끊었습니다. 로비로 돌아갑니다.');
      handlePlayAgain();
    };

    const handleError = (message: string) => {
      console.error('Server error:', message);
      alert(`에러: ${message}`);
    };

    on('matched', handleMatched);
    on('readyStateChanged', handleReadyStateChanged);
    on('gameStart', handleGameStart);
    on('gameUpdate', handleGameUpdate);
    on('opponentDisconnected', handleOpponentDisconnected);
    on('error', handleError);

    return () => {
      off('matched', handleMatched);
      off('readyStateChanged', handleReadyStateChanged);
      off('gameStart', handleGameStart);
      off('gameUpdate', handleGameUpdate);
      off('opponentDisconnected', handleOpponentDisconnected);
      off('error', handleError);
    };
  }, [on, off, player?.id, gameMode]);

  const handleJoinGame = (nickname: string) => {
    setGameMode('multiplayer');
    setAppState('waiting');
    joinGame(nickname);
  };

  const handleStartAI = (nickname: string, difficulty: 'easy' | 'medium' | 'hard') => {
    setGameMode('ai');
    setAiDifficulty(difficulty);

    // AI 게임 설정
    const playerColor: PlayerColor = Math.random() < 0.5 ? 'black' : 'white';
    const aiColor: PlayerColor = playerColor === 'black' ? 'white' : 'black';

    const humanPlayer: Player = {
      id: 'human',
      nickname,
      color: playerColor,
      ready: true
    };

    const aiPlayer: Player = {
      id: 'ai',
      nickname: `AI (${difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'})`,
      color: aiColor,
      ready: true
    };

    setPlayer(humanPlayer);
    setOpponent(aiPlayer);

    // 초기 게임 상태 생성
    const initialBoard: CellState[][] = Array(8).fill(null).map(() => Array(8).fill('empty'));
    initialBoard[3][3] = 'white';
    initialBoard[3][4] = 'black';
    initialBoard[4][3] = 'black';
    initialBoard[4][4] = 'white';

    const initialGameState: GameState = {
      board: initialBoard,
      currentTurn: 'black',
      blackCount: 2,
      whiteCount: 2,
      validMoves: getValidMovesForAI(initialBoard, 'black'),
      gameOver: false,
      winner: null
    };

    setGameState(initialGameState);
    setAppState('playing');
  };

  const handleReady = (ready: boolean) => {
    if (gameMode === 'multiplayer') {
      playerReady(ready);
    }
  };

  const handleMove = (position: Position) => {
    if (gameMode === 'multiplayer') {
      if (gameState && gameState.currentTurn === player?.color) {
        makeMove(position);
      }
    } else if (gameMode === 'ai') {
      // AI 모드에서 플레이어 이동
      if (gameState && gameState.currentTurn === player?.color) {
        handleLocalMove(position, player.color);
      }
    }
  };

  const handleAIMove = (position: Position) => {
    if (opponent) {
      handleLocalMove(position, opponent.color);
    }
  };

  const handleLocalMove = (position: Position, playerColor: PlayerColor) => {
    if (!gameState) return;

    try {
      // 로컬에서 게임 로직 실행
      const newBoard = makeLocalMove(gameState.board, position.row, position.col, playerColor);
      const { black, white } = countPieces(newBoard);

      // 다음 플레이어 결정
      const nextPlayer = getNextPlayer(newBoard, playerColor);

      // 게임 종료 확인
      const { gameOver, winner } = checkLocalGameOver(newBoard, nextPlayer);

      const newGameState: GameState = {
        board: newBoard,
        currentTurn: nextPlayer,
        blackCount: black,
        whiteCount: white,
        validMoves: getValidMovesForAI(newBoard, nextPlayer),
        gameOver,
        winner
      };

      setGameState(newGameState);
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const makeLocalMove = (board: CellState[][], row: number, col: number, player: PlayerColor): CellState[][] => {
    const newBoard = board.map(r => [...r]);
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

      while (x >= 0 && x < 8 && y >= 0 && y < 8) {
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
  };

  const countPieces = (board: CellState[][]): { black: number; white: number } => {
    let black = 0, white = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === 'black') black++;
        if (board[row][col] === 'white') white++;
      }
    }
    return { black, white };
  };

  const getNextPlayer = (board: CellState[][], currentPlayer: PlayerColor): PlayerColor => {
    const opponent: PlayerColor = currentPlayer === 'black' ? 'white' : 'black';
    const opponentMoves = getValidMovesForAI(board, opponent);

    if (opponentMoves.length > 0) {
      return opponent;
    }
    return currentPlayer;
  };

  const checkLocalGameOver = (board: CellState[][], currentPlayer: PlayerColor): { gameOver: boolean; winner: PlayerColor | 'draw' | null } => {
    const currentMoves = getValidMovesForAI(board, currentPlayer);
    const opponent: PlayerColor = currentPlayer === 'black' ? 'white' : 'black';
    const opponentMoves = getValidMovesForAI(board, opponent);

    if (currentMoves.length === 0 && opponentMoves.length === 0) {
      const { black, white } = countPieces(board);
      let winner: PlayerColor | 'draw' | null = null;

      if (black > white) winner = 'black';
      else if (white > black) winner = 'white';
      else winner = 'draw';

      return { gameOver: true, winner };
    }

    return { gameOver: false, winner: null };
  };

  const handlePlayAgain = () => {
    setAppState('lobby');
    setPlayer(null);
    setOpponent(null);
    setGameState(null);
    setGameMode('multiplayer');
  };

  if (gameMode === 'multiplayer' && !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xl text-gray-300">서버에 연결 중...</p>
        </div>
      </div>
    );
  }

  if (appState === 'lobby' || appState === 'waiting') {
    return <Lobby onJoinGame={handleJoinGame} onStartAI={handleStartAI} isWaiting={appState === 'waiting'} />;
  }

  if (appState === 'ready' && player && opponent && gameMode === 'multiplayer') {
    return <ReadyRoom player={player} opponent={opponent} onReady={handleReady} />;
  }

  if (appState === 'playing' && player && opponent && gameState) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              오델로 {gameMode === 'ai' && '- AI 대전'}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:order-1">
              <PlayerInfo
                player={player}
                opponent={opponent}
                currentTurn={gameState.currentTurn}
                blackCount={gameState.blackCount}
                whiteCount={gameState.whiteCount}
              />
            </div>

            <div className="lg:order-2 lg:col-span-2">
              <GameBoard
                gameState={gameState}
                player={player}
                onMove={handleMove}
              />
            </div>
          </div>

          <GameResult
            gameState={gameState}
            player={player}
            onPlayAgain={handlePlayAgain}
          />
        </div>
      </div>
    );
  }

  return null;
}

export default App;
