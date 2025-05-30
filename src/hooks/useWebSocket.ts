
import { useState, useEffect, useCallback, useRef } from 'react';
import { LogMessage } from '../types/log';
import { toast } from '@/hooks/use-toast';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UseWebSocketOptions {
  url: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  autoShowToasts?: boolean;
  pollingInterval?: number;
}

export function useWebSocket({
  url,
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10,
  autoShowToasts = false, // Changed default to false
  pollingInterval = 200
}: UseWebSocketOptions) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isPaused = useRef(false);
  const logBufferRef = useRef<LogMessage[]>([]);
  const processingRef = useRef(false);
  
  // Function to process log buffer with throttling
  const processLogBuffer = useCallback(() => {
    if (processingRef.current || isPaused.current || logBufferRef.current.length === 0) return;
    
    processingRef.current = true;
    
    // Get logs from buffer
    const newLogs = [...logBufferRef.current];
    logBufferRef.current = [];
    
    // Update logs with animation-friendly approach
    setLogs(prev => [...newLogs, ...prev]);
    
    setTimeout(() => {
      processingRef.current = false;
      if (logBufferRef.current.length > 0) {
        processLogBuffer();
      }
    }, pollingInterval);
  }, [pollingInterval]);
  
  const clearLogs = useCallback(() => {
    setLogs([]);
    logBufferRef.current = [];
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
      setErrorMessage(undefined);
      
      // Validate URL format before attempting connection
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        setStatus('disconnected');
        setErrorMessage('Invalid WebSocket URL format. URL must start with ws:// or wss://');
        console.error('Invalid WebSocket URL format:', url);
        return;
      }
      
      console.log('Attempting to connect to WebSocket:', url);
      const socket = new WebSocket(url);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setStatus('connected');
        setErrorMessage(undefined);
        reconnectAttemptsRef.current = 0;
        
        // Display a toast notification when successfully connected
        if (autoShowToasts) {
          toast({
            title: "Connected",
            description: "Successfully connected to log stream",
          });
        }
      };
      
      socket.onmessage = (event) => {
        if (isPaused.current) return;
        
        try {
          const data = JSON.parse(event.data) as LogMessage;
          
          // Add to buffer instead of directly updating state
          logBufferRef.current.push(data);
          
          // Trigger processing if not already processing
          if (!processingRef.current) {
            processLogBuffer();
          }
          
        } catch (error) {
          console.error('Error parsing log message:', error);
          // If data doesn't match expected format, still try to show it
          const errorLog: LogMessage = {
            time: new Date().toISOString(),
            level: 'ERROR',
            message: `Failed to parse log: ${event.data}`,
            name: 'websocket',
            function: 'onmessage',
            line: 0
          };
          
          logBufferRef.current.push(errorLog);
          
          // Trigger processing if not already processing
          if (!processingRef.current) {
            processLogBuffer();
          }
        }
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket connection closed', event);
        setStatus('disconnected');
        
        // Set more descriptive error message based on close code
        if (event.code === 1006) {
          setErrorMessage('Connection closed abnormally');
        } else if (event.code !== 1000) {
          setErrorMessage(`Connection closed (code: ${event.code})`);
        }
        
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          if (autoShowToasts) {
            toast({
              title: "Disconnected",
              description: `Reconnecting in ${reconnectInterval / 1000} seconds...`,
              variant: "destructive"
            });
          }
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setErrorMessage(`Max reconnection attempts reached (${maxReconnectAttempts})`);
          if (autoShowToasts) {
            toast({
              title: "Connection Failed",
              description: "Max reconnection attempts reached. Please refresh the page.",
              variant: "destructive"
            });
          }
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setErrorMessage('Connection error. Server may be unavailable.');
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setStatus('disconnected');
      setErrorMessage('Failed to establish connection');
      
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, reconnectInterval);
      }
    }
  }, [
    autoReconnect, 
    autoShowToasts,
    maxReconnectAttempts, 
    reconnectInterval, 
    url, 
    processLogBuffer
  ]);
  
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
    errorMessage,
    clearLogs,
    togglePause,
    isPaused: isPaused.current
  };
}
