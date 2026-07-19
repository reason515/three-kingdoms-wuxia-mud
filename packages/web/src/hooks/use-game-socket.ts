import { useCallback, useEffect, useRef, useState } from 'react';

export type ConnectionState = 'idle' | 'connecting' | 'reconnecting' | 'connected' | 'failed';
export type RoomState = { id: string; name: string; description: string; exits: Record<string, string>; npcs: Array<{ id: string; name: string; role: string }> };
type GatewayEvent = { type: 'session.ready' } | { type: 'room.update'; room: RoomState } | { type: 'error'; code: string };

declare global { interface Window { __testCloseWS?: () => void } }

declare const __TEST__: boolean;

export function useGameSocket(enabled: boolean, username: string, password: string): {
  state: ConnectionState; room: RoomState | undefined; look: () => void; move: (direction: string) => void;
} {
  const [state, setState] = useState<ConnectionState>('idle');
  const [room, setRoom] = useState<RoomState>();
  const socketRef = useRef<WebSocket | undefined>(undefined);
  const authenticatedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setState('idle');
      setRoom(undefined);
      return;
    }
    let disposed = false;
    let retryTimer: number | undefined;
    let attempts = 0;

    const connect = () => {
      if (disposed) return;
      const socket = new WebSocket('ws://127.0.0.1:3002/ws');
      socketRef.current = socket;
      authenticatedRef.current = false;
      setState(attempts === 0 ? 'connecting' : 'reconnecting');
      socket.onopen = () => socket.send(JSON.stringify({ type: 'auth.login', username, password }));
      socket.onmessage = (message) => {
        const event = JSON.parse(String(message.data)) as GatewayEvent;
        if (event.type === 'session.ready') {
          authenticatedRef.current = true;
          attempts = 0;
          setState('connected');
        } else if (event.type === 'room.update') {
          setRoom(event.room);
        } else if (event.type === 'error') {
          setState('failed');
        }
      };
      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (disposed) return;
        if (authenticatedRef.current) setState('reconnecting');
        attempts += 1;
        retryTimer = window.setTimeout(connect, Math.min(500 + 300 * attempts, 2_000));
      };
    };

    connect();
    if (__TEST__) window.__testCloseWS = () => socketRef.current?.close();
    return () => {
      disposed = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      const socket = socketRef.current;
      socketRef.current = undefined;
      socket?.close();
      if (__TEST__) delete window.__testCloseWS;
    };
  }, [enabled, password, username]);

  const look = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'look' }));
  }, []);
  const move = useCallback((direction: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'move', direction }));
  }, []);

  return { state, room, look, move };
}

export function connectionLabel(state: ConnectionState): string {
  return { idle: '尚未入城', connecting: '正在系缆', reconnecting: '正在重系缆绳', connected: '江湖已通', failed: '与江湖失了音讯' }[state];
}
