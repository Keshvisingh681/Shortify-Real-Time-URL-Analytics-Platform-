import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  event: string;
  payload: any;
}

export function useWebSocket(onMessage: (event: string, payload: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: number;

    function connect() {
      const socket = new WebSocket('ws://localhost:5000/ws');
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log('🔌 WebSocket connected to analytics server');
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          onMessage(data.event, data.payload);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log('🔌 WebSocket disconnected. Reconnecting in 3s...');
        reconnectTimeout = window.setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [onMessage]);

  return isConnected;
}
