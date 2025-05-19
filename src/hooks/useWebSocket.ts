
import { useState, useEffect, useCallback, useRef } from 'react';
import { LogMessage } from '../types/log';
import { toast } from '@/hooks/use-toast';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UseWebSocketOptions {
  url: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  url,
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10
}: UseWebSocketOptions) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isPaused = useRef(false);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const togglePause = useCallback(() => {
    isPaused.current = !isPaused.current;
    return isPaused.current;
  }, []);

  const connect = useCallback(() => {
    try {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      setStatus('connecting');
      
      const socket = new WebSocket(url);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Display a toast notification when successfully connected
        toast({
          title: "Connected",
          description: "Successfully connected to log stream",
        });
      };
      
      socket.onmessage = (event) => {
        if (isPaused.current) return;
        
        try {
          const data = JSON.parse(event.data) as LogMessage;
          setLogs(prev => [data, ...prev]);
        } catch (error) {
          console.error('Error parsing log message:', error);
          // If data doesn't match expected format, still try to show it
          setLogs(prev => [{
            time: new Date().toISOString(),
            level: 'ERROR',
            message: `Failed to parse log: ${event.data}`,
            name: 'websocket',
            function: 'onmessage',
            line: 0
          }, ...prev]);
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setStatus('disconnected');
        
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          toast({
            title: "Disconnected",
            description: `Reconnecting in ${reconnectInterval / 1000} seconds...`,
            variant: "destructive"
          });
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          toast({
            title: "Connection Failed",
            description: "Max reconnection attempts reached. Please refresh the page.",
            variant: "destructive"
          });
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setStatus('disconnected');
      
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, reconnectInterval);
      }
    }
  }, [autoReconnect, maxReconnectAttempts, reconnectInterval, url]);
  
  useEffect(() => {
    connect();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);
  
  return {
    logs,
    status,
    clearLogs,
    togglePause,
    isPaused: isPaused.current
  };
}
