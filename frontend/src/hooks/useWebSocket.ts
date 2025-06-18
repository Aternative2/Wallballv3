import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = (url: string) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    try {
      console.log('Attempting to connect to WebSocket:', url);
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully to:', url);
        setIsConnected(true);
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          setLastMessage(data);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
    }

    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [url]);

  const sendMessage = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, sendMessage, lastMessage };
};