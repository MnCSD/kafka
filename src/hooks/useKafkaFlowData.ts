import { useEffect, useState, useCallback } from 'react';
import { WebSocketService, WebSocketMessage } from '../services/WebSocketService.js';
import { FlowOutput } from '../services/KafkaOutputMonitor.js';

interface UseKafkaFlowDataOptions {
  autoConnect?: boolean;
  maxRetries?: number;
  onError?: (error: any) => void;
}

interface KafkaFlowDataState {
  isConnected: boolean;
  latestOutput: FlowOutput | null;
  allOutputs: FlowOutput[];
  monitoringStatus: any;
  error: string | null;
}

export const useKafkaFlowData = (
  websocketUrl: string = 'ws://localhost:8080',
  options: UseKafkaFlowDataOptions = {}
) => {
  const { autoConnect = true, onError } = options;
  
  const [wsService] = useState(() => new WebSocketService(websocketUrl));
  const [state, setState] = useState<KafkaFlowDataState>({
    isConnected: false,
    latestOutput: null,
    allOutputs: [],
    monitoringStatus: null,
    error: null
  });

  const updateState = useCallback((updates: Partial<KafkaFlowDataState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(async () => {
    try {
      await wsService.connect();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      updateState({ error: error.message });
      onError?.(error);
    }
  }, [wsService, onError, updateState]);

  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, [wsService]);

  const requestLatestOutputs = useCallback((limit: number = 10) => {
    wsService.send({
      type: 'get-latest-outputs',
      limit
    });
  }, [wsService]);

  const requestStatus = useCallback(() => {
    wsService.send({
      type: 'get-status'
    });
  }, [wsService]);

  const monitorSpecificOrg = useCallback((orgUsrNode: string) => {
    wsService.send({
      type: 'monitor-specific-org',
      orgUsrNode
    });
  }, [wsService]);

  useEffect(() => {
    // Set up event listeners
    const handleConnected = () => {
      updateState({ isConnected: true, error: null });
      requestStatus();
    };

    const handleDisconnected = () => {
      updateState({ isConnected: false });
    };

    const handleError = (error: any) => {
      updateState({ error: error.message || 'WebSocket error' });
      onError?.(error);
    };

    const handleMessage = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'flow-output':
          if (Array.isArray(message.data)) {
            // Multiple outputs
            updateState({ allOutputs: message.data });
          } else {
            // Single output
            updateState({ 
              latestOutput: message.data,
              allOutputs: prev => [message.data, ...prev].slice(0, 100) // Keep last 100
            });
          }
          break;
          
        case 'flow-status':
          updateState({ monitoringStatus: message.data });
          break;
          
        case 'error':
          updateState({ error: message.data.error });
          break;
      }
    };

    wsService.on('connected', handleConnected);
    wsService.on('disconnected', handleDisconnected);
    wsService.on('error', handleError);
    wsService.on('message', handleMessage);

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Cleanup
    return () => {
      wsService.off('connected', handleConnected);
      wsService.off('disconnected', handleDisconnected);
      wsService.off('error', handleError);
      wsService.off('message', handleMessage);
      
      if (autoConnect) {
        disconnect();
      }
    };
  }, [wsService, autoConnect, connect, disconnect, requestStatus, onError, updateState]);

  return {
    ...state,
    connect,
    disconnect,
    requestLatestOutputs,
    requestStatus,
    monitorSpecificOrg,
    isConnected: state.isConnected
  };
};