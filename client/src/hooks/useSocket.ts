import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, MatchData, Position } from '../types/game';

interface ServerToClientEvents {
    matched: (data: MatchData) => void;
    gameStart: (gameState: GameState) => void;
    gameUpdate: (gameState: GameState) => void;
    opponentDisconnected: () => void;
    readyStateChanged: (data: { playerId: string; ready: boolean }) => void;
    error: (message: string) => void;
}

interface ClientToServerEvents {
    joinGame: (nickname: string) => void;
    playerReady: (ready: boolean) => void;
    makeMove: (position: Position) => void;
    leaveGame: () => void;
}

const SERVER_URL = import.meta.env.PROD
    ? window.location.origin
    : 'http://localhost:3000';

export function useSocket() {
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        socketRef.current = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const joinGame = (nickname: string) => {
        socketRef.current?.emit('joinGame', nickname);
    };

    const playerReady = (ready: boolean) => {
        socketRef.current?.emit('playerReady', ready);
    };

    const makeMove = (position: Position) => {
        socketRef.current?.emit('makeMove', position);
    };

    const leaveGame = () => {
        socketRef.current?.emit('leaveGame');
    };

    const on = <K extends keyof ServerToClientEvents>(
        event: K,
        handler: ServerToClientEvents[K]
    ) => {
        socketRef.current?.on(event, handler as any);
    };

    const off = <K extends keyof ServerToClientEvents>(
        event: K,
        handler: ServerToClientEvents[K]
    ) => {
        socketRef.current?.off(event, handler as any);
    };

    return {
        socket: socketRef.current,
        isConnected,
        joinGame,
        playerReady,
        makeMove,
        leaveGame,
        on,
        off,
    };
}
