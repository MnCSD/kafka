import { useEffect, useState, useCallback, useRef } from 'react';
import { FlowOutput } from '../services/KafkaOutputMonitor.js';

interface UseKafkaFlowDataOptions {
  autoConnect?: boolean;
  maxRetries?: number;
  onError?: (error: any) => void;
  onFlowOutput?: (output: FlowOutput) => void;
  orgUsrNode?: string; // Monitor specific workflow
}

interface KafkaFlowDataState {
  isConnected: boolean;
  latestOutput: FlowOutput | null;
  allOutputs: FlowOutput[];
  monitoringStatus: any;
  error: string | null;
  connectionAttempts: number;
}

interface WebSocketMessage {
  type: 'flow-output' | 'flow-status' | 'error' | 'monitoring-started';
  data: any;
  timestamp: string;
}

export const useKafkaFlowData = (
  websocketUrl: string = 'ws://localhost:8080',
  options: UseKafkaFlowDataOptions = {}
) => {
  const { 
    autoConnect = true, 
    maxRetries = 5, 
    onError, 
    onFlowOutput,
    orgUsrNode 
  } = options;
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  
  const [state, setState] = useState<KafkaFlowDataState>({
    isConnected: false,
    latestOutput: null,
    allOutputs: [],
    monitoringStatus: null,
    error: null,
    connectionAttempts: 0
  });

  const updateState = useCallback((updates: Partial<KafkaFlowDataState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    isConnectingRef.current = false;
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    if (isConnectingRef.current || (wsRef.current?.readyState === WebSocket.OPEN)) {
      return true;
    }

    return new Promise((resolve) => {
      isConnectingRef.current = true;
      updateState(prev => ({ 
        ...prev, 
        connectionAttempts: prev.connectionAttempts + 1,
        error: null 
      }));

      try {
        const ws = new WebSocket(websocketUrl);
        wsRef.current = ws;

        const connectTimeout = setTimeout(() => {
          ws.close();
          isConnectingRef.current = false;
          updateState({ error: 'Connection timeout' });
          resolve(false);
        }, 10000); // 10 second timeout

        ws.onopen = () => {
          clearTimeout(connectTimeout);
          console.log('🔌 WebSocket connected to Kafka service');
          isConnectingRef.current = false;
          updateState({ 
            isConnected: true, 
            error: null,
            connectionAttempts: 0 
          });

          // Request initial status
          ws.send(JSON.stringify({ type: 'get-status' }));
          
          // Monitor specific org if provided
          if (orgUsrNode) {
            ws.send(JSON.stringify({ 
              type: 'monitor-specific-org', 
              orgUsrNode 
            }));
          }

          resolve(true);
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case 'flow-output':
                if (Array.isArray(message.data)) {
                  // Multiple outputs (historical data)
                  updateState({ allOutputs: message.data });
                } else {
                  // Single new output
                  const output = message.data as FlowOutput;
                  updateState(prev => ({ 
                    latestOutput: output,
                    allOutputs: [output, ...prev.allOutputs].slice(0, 100) // Keep last 100
                  }));
                  
                  // Call callback if provided
                  onFlowOutput?.(output);
                }
                break;
                
              case 'flow-status':
                updateState({ monitoringStatus: message.data });
                break;
                
              case 'error':
                updateState({ error: message.data.error });
                onError?.(new Error(message.data.error));
                break;

              case 'monitoring-started':
                console.log('✅ Kafka monitoring started:', message.data);
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            updateState({ error: 'Failed to parse message from server' });
          }
        };

        ws.onclose = (event) => {
          clearTimeout(connectTimeout);
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          isConnectingRef.current = false;
          updateState({ isConnected: false });
          
          // Attempt reconnection if not manually closed
          if (event.code !== 1000 && state.connectionAttempts < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, state.connectionAttempts), 30000);
            console.log(`🔄 Reconnecting in ${delay}ms...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
          
          resolve(false);
        };

        ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          console.error('❌ WebSocket error:', error);
          isConnectingRef.current = false;
          updateState({ error: 'WebSocket connection failed' });
          onError?.(error);
          resolve(false);
        };

      } catch (error) {
        isConnectingRef.current = false;
        updateState({ error: error.message });
        onError?.(error);
        resolve(false);
      }
    });
  }, [websocketUrl, orgUsrNode, onFlowOutput, onError, maxRetries, state.connectionAttempts, updateState]);

  const disconnect = useCallback(() => {
    cleanup();
    updateState({ isConnected: false, error: null });
  }, [cleanup, updateState]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('⚠️ WebSocket not connected, cannot send message');
    return false;
  }, []);

  const requestLatestOutputs = useCallback((limit: number = 10) => {
    return sendMessage({
      type: 'get-latest-outputs',
      limit
    });
  }, [sendMessage]);

  const requestStatus = useCallback(() => {
    return sendMessage({
      type: 'get-status'
    });
  }, [sendMessage]);

  const monitorSpecificOrg = useCallback((targetOrgUsrNode: string) => {
    return sendMessage({
      type: 'monitor-specific-org',
      orgUsrNode: targetOrgUsrNode
    });
  }, [sendMessage]);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [autoConnect]); // Only run on mount/unmount

  // Monitor specific org effect
  useEffect(() => {
    if (state.isConnected && orgUsrNode) {
      monitorSpecificOrg(orgUsrNode);
    }
  }, [state.isConnected, orgUsrNode, monitorSpecificOrg]);

  return {
    // State
    isConnected: state.isConnected,
    latestOutput: state.latestOutput,
    allOutputs: state.allOutputs,
    monitoringStatus: state.monitoringStatus,
    error: state.error,
    connectionAttempts: state.connectionAttempts,
    
    // Actions
    connect,
    disconnect,
    requestLatestOutputs,
    requestStatus,
    monitorSpecificOrg,
    sendMessage,
    
    // Computed
    isMonitoring: state.monitoringStatus?.isMonitoring || false,
    totalOutputs: state.monitoringStatus?.totalOutputs || 0,
    topicCount: state.monitoringStatus?.topicCount || 0
  };
};

// Specialized hook for workflow integration
export const useWorkflowKafkaData = (workflowName?: string, organizationName?: string, userName?: string) => {
  const orgUsrNode = workflowName && organizationName && userName 
    ? `${organizationName}-${userName}-${workflowName}` 
    : undefined;

  const kafkaData = useKafkaFlowData('ws://localhost:8080', {
    orgUsrNode,
    onFlowOutput: (output) => {
      console.log(`📨 Workflow ${workflowName} received output:`, output);
    },
    onError: (error) => {
      console.error(`❌ Kafka error for workflow ${workflowName}:`, error);
    }
  });

  return {
    ...kafkaData,
    workflowName,
    orgUsrNode,
    // Helper to check if output is for this workflow
    isOutputForWorkflow: (output: FlowOutput) => {
      return orgUsrNode ? output.orgUsrNode === orgUsrNode : false;
    }
  };
};