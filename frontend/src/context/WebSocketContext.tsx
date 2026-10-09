import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Types
interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionAttempts: number;
  lastMessage: WebSocketMessage | null;
  messages: WebSocketMessage[];
  sendMessage: (message: WebSocketMessage) => void;
  reconnect: () => void;
}

// Create context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Provider component
interface WebSocketProviderProps {
  children: ReactNode;
}

// Configuration
const WS_URL = (import.meta as { env: { VITE_WS_URL?: string } }).env?.VITE_WS_URL || 'ws://localhost:8000';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (!isAuthenticated || !user?._id || !token) {
      return;
    }

    setIsConnecting(true);
    
    try {
      // Close existing connection
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Create new connection with token
      const wsUrl = `${WS_URL}/api/ws/${user._id}?token=${encodeURIComponent(token)}`;
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionAttempts(0);
        socketRef.current = newSocket;
        setSocket(newSocket);
        
        // Send connection acknowledgment
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify({
            type: 'CONNECTION_ESTABLISHED',
            data: { userId: user._id },
          }));
        }
      };

      newSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📥 WebSocket message:', message);
          
          setLastMessage(message);
          setMessages(prev => [...prev, message]);
          
          // Handle specific message types
          switch (message.type) {
            case 'NEW_NOTIFICATION':
              // Can trigger notification display
              break;
            case 'PONG':
              // Heartbeat response
              break;
            default:
              console.log('Unhandled WebSocket message:', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = (event) => {
        console.log('🔴 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect if not intentional close
        if (event.code !== 1000 && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
          scheduleReconnect();
        }
      };

      newSocket.onerror = (error) => {
        console.error('⚠️ WebSocket error:', error);
        setIsConnecting(false);
      };

      socketRef.current = newSocket;
      setSocket(newSocket);
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setIsConnecting(false);
    }
  }, [isAuthenticated, user?._id, token, connectionAttempts]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionAttempts(prev => prev + 1);
      connect();
    }, RECONNECT_DELAY);
  }, [connect]);

  // Reconnect manually
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setConnectionAttempts(0);
    connect();
  }, [connect]);

  // Send message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  }, []);

  // Connect/disconnect based on authentication
  useEffect(() => {
    if (isAuthenticated && user?._id && token) {
      connect();
    } else {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user?._id, token, connect]);

  // Send heartbeat periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && socketRef.current) {
        sendMessage({
          type: 'PING',
          data: { timestamp: new Date().toISOString() },
        });
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [isConnected, sendMessage]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    isConnecting,
    connectionAttempts,
    lastMessage,
    messages,
    sendMessage,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Export context for testing
export { WebSocketContext };
