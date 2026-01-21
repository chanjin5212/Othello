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
  const [isManualOpening, setIsManualOpening] = useState(false);

  const { isConnected, joinGame, playerReady, makeMove, on, off } = useSocket();

  useEffect(() => {
    if (gameMode === 'ai' && gameState && !gameState.gameOver && appState === 'playing') {
      const aiColor: PlayerColor = opponent?.color || 'white';

      if (gameState.currentTurn === aiColor) {
        const totalPieces = gameState.blackCount + gameState.whiteCount;
        if (isManualOpening && totalPieces === 4 && aiColor === 'black') {
          return;
        }

        const timeout = setTimeout(() => {
          const aiMove = calculateAIMove(gameState.board, aiColor, aiDifficulty);
          if (aiMove) {
            handleAIMove(aiMove);
          }
        }, 1000);

        return () => clearTimeout(timeout);
      }
    }
  }, [gameState, gameMode, appState, opponent?.color, aiDifficulty, isManualOpening]);

  useEffect(() => {
    if (gameMode !== 'multiplayer') return;

    const handleMatched = (data: any) => {
      setPlayer(data.player);
      setOpponent(data.opponent);
      setAppState('ready');
    };

    const handleReadyStateChanged = (data: { playerId: string; ready: boolean }) => {
      if (data.playerId === player?.id) {
        setPlayer(prev => prev ? { ...prev, ready: data.ready } : null);
      } else {
        setOpponent(prev => prev ? { ...prev, ready: data.ready } : null);
      }
    };

    const handleGameStart = (state: GameState) => {
      setGameState(state);
      setAppState('playing');
    };

    const handleGameUpdate = (state: GameState) => {
      setGameState(state);
    };

    const handleOpponentDisconnected = () => {
      alert('상대방이 연결을 끊었습니다. 로비로 돌아갑니다.');
      handlePlayAgain();
    };

    const handleError = (message: string) => {
      console.error('Server error:', message);
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

  const handleStartAI = (nickname: string, difficulty: 'easy' | 'medium' | 'hard', playerColor: PlayerColor, manualOpening: boolean) => {
    setGameMode('ai');
    setAiDifficulty(difficulty);
    setIsManualOpening(manualOpening);

    const aiColor: PlayerColor = playerColor === 'black' ? 'white' : 'black';

    setPlayer({ id: 'human', nickname, color: playerColor, ready: true });
    setOpponent({ id: 'ai', nickname: `AI (${difficulty})`, color: aiColor, ready: true });

    const initialBoard: CellState[][] = Array(8).fill(null).map(() => Array(8).fill('empty'));
    initialBoard[3][3] = 'white';
    initialBoard[3][4] = 'black';
    initialBoard[4][3] = 'black';
    initialBoard[4][4] = 'white';

    setGameState({
      board: initialBoard,
      currentTurn: 'black',
      blackCount: 2,
      whiteCount: 2,
      validMoves: getValidMovesForAI(initialBoard, 'black'),
      gameOver: false,
      winner: null
    });
    setAppState('playing');
  };

  const handleReady = (ready: boolean) => {
    if (gameMode === 'multiplayer') playerReady(ready);
  };

  const handleMove = (position: Position) => {
    if (gameMode === 'multiplayer') {
      if (gameState && gameState.currentTurn === player?.color) makeMove(position);
    } else if (gameMode === 'ai') {
      if (gameState && gameState.currentTurn === player?.color) {
        handleLocalMove(position, player.color);
      } else if (isManualOpening && gameState && gameState.currentTurn === opponent?.color) {
        const totalPieces = gameState.blackCount + gameState.whiteCount;
        if (totalPieces === 4) {
          handleLocalMove(position, opponent!.color);
          setIsManualOpening(false);
        }
      }
    }
  };

  const handleAIMove = (position: Position) => {
    if (opponent) handleLocalMove(position, opponent.color);
  };

  const handleLocalMove = (position: Position, turnPlayerColor: PlayerColor) => {
    if (!gameState) return;
    try {
      const newBoard = makeLocalMove(gameState.board, position.row, position.col, turnPlayerColor);
      const { black, white } = countPieces(newBoard);
      const nextPlayer = getNextPlayer(newBoard, turnPlayerColor);
      const { gameOver, winner } = checkLocalGameOver(newBoard, nextPlayer);

      setGameState({
        board: newBoard,
        currentTurn: nextPlayer,
        blackCount: black,
        whiteCount: white,
        validMoves: getValidMovesForAI(newBoard, nextPlayer),
        gameOver,
        winner
      });
    } catch (error) { console.error(error); }
  };

  const makeLocalMove = (board: CellState[][], row: number, col: number, playerColor: PlayerColor): CellState[][] => {
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = playerColor;
    const opponentColor = playerColor === 'black' ? 'white' : 'black';
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    for (const [dx, dy] of directions) {
      const toFlip: Position[] = [];
      let x = row + dx; let y = col + dy;
      while (x >= 0 && x < 8 && y >= 0 && y < 8) {
        if (newBoard[x][y] === 'empty') break;
        if (newBoard[x][y] === opponentColor) toFlip.push({ row: x, col: y });
        else if (newBoard[x][y] === playerColor) {
          toFlip.forEach(pos => newBoard[pos.row][pos.col] = playerColor);
          break;
        }
        x += dx; y += dy;
      }
    }
    return newBoard;
  };

  const countPieces = (board: CellState[][]) => {
    let black = 0, white = 0;
    black = board.flat().filter(c => c === 'black').length;
    white = board.flat().filter(c => c === 'white').length;
    return { black, white };
  };

  const getNextPlayer = (board: CellState[][], currentPlayer: PlayerColor): PlayerColor => {
    const opponentColor = currentPlayer === 'black' ? 'white' : 'black';
    if (getValidMovesForAI(board, opponentColor).length > 0) return opponentColor;
    if (getValidMovesForAI(board, currentPlayer).length > 0) return currentPlayer;
    return currentPlayer;
  };

  const checkLocalGameOver = (board: CellState[][], currentPlayer: PlayerColor) => {
    if (getValidMovesForAI(board, currentPlayer).length === 0) {
      const opponentColor = currentPlayer === 'black' ? 'white' : 'black';
      if (getValidMovesForAI(board, opponentColor).length === 0) {
        const { black, white } = countPieces(board);
        let winner: PlayerColor | 'draw' | null = black > white ? 'black' : white > black ? 'white' : 'draw';
        return { gameOver: true, winner };
      }
    }
    return { gameOver: false, winner: null };
  };

  const handlePlayAgain = () => {
    setAppState('lobby');
    setPlayer(null);
    setOpponent(null);
    setGameState(null);
    setGameMode('multiplayer');
    setIsManualOpening(false);
  };

  if (!isConnected && gameMode === 'multiplayer') { /* Loading... */ }
  if (appState === 'lobby' || appState === 'waiting') return <Lobby onJoinGame={handleJoinGame} onStartAI={handleStartAI} isWaiting={appState === 'waiting'} />;
  if (appState === 'ready' && player && opponent && gameMode === 'multiplayer') return <ReadyRoom player={player} opponent={opponent} onReady={handleReady} />;

  if (appState === 'playing' && player && opponent && gameState) {
    const isOpeningMode = isManualOpening && gameState.currentTurn === opponent.color && (gameState.blackCount + gameState.whiteCount === 4);

    return (
      <div className="h-[100dvh] w-full bg-slate-900 flex flex-col items-center safe-area-padding overflow-hidden">
        {/* Opponent Info */}
        <div className="w-full max-w-lg px-4 pt-2 pb-1 flex-none z-10">
          <PlayerInfo
            isOpponent={true}
            player={opponent}
            isActive={gameState.currentTurn === opponent.color}
            score={opponent.color === 'black' ? gameState.blackCount : gameState.whiteCount}
          />
        </div>

        {/* Game Board Area: Takes all available space, board scales to fit */}
        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-0 px-2 relative">
          {isOpeningMode && (
            <div className="absolute top-2 z-20 px-4 py-1 bg-yellow-500/90 text-yellow-50 text-sm font-bold rounded-full animate-pulse shadow-lg backdrop-blur-sm pointer-events-none">
              ✨ AI의 첫 수를 대신 두세요!
            </div>
          )}

          <div className="relative w-full h-full max-w-lg flex items-center justify-center">
            {/* aspect-square ensures it stays square, max-h-full/max-w-full ensures it fits in container */}
            <div className="aspect-square w-full h-auto max-h-full max-w-full shadow-2xl rounded-lg">
              <GameBoard
                gameState={gameState}
                player={player}
                onMove={handleMove}
                isManualOpening={isOpeningMode}
              />
            </div>
          </div>
        </div>

        {/* Player Info */}
        <div className="w-full max-w-lg px-4 pt-1 pb-4 flex-none z-10">
          <div className="text-gray-500 text-[10px] text-center mb-1 font-mono uppercase tracking-widest opacity-50">
            {gameMode === 'ai' ? `AI: ${aiDifficulty}` : 'Multiplayer'}
          </div>
          <PlayerInfo
            isOpponent={false}
            player={player}
            isActive={gameState.currentTurn === player.color}
            score={player.color === 'black' ? gameState.blackCount : gameState.whiteCount}
          />
        </div>

        {gameState.gameOver && (
          <GameResult
            gameState={gameState}
            player={player}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
    );
  }
  return null;
}

export default App;
