import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useKafkaFlowData, useWorkflowKafkaData } from '../hooks/useKafkaFlowData.js';
import { FlowOutput } from '../services/KafkaOutputMonitor.js';
import { workflowsStore } from '../stores';

// Simple status indicator component
export const KafkaConnectionStatus: React.FC<{ isConnected: boolean; error?: string | null }> = ({ isConnected, error }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px',
    padding: '8px 12px',
    background: isConnected ? '#e8f5e8' : '#ffeaea',
    border: `1px solid ${isConnected ? '#4caf50' : '#f44336'}`,
    borderRadius: '4px',
    fontSize: '14px'
  }}>
    <div style={{
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: isConnected ? '#4caf50' : '#f44336'
    }} />
    <span>
      Kafka: {isConnected ? 'Connected' : 'Disconnected'}
      {error && ` (${error})`}
    </span>
  </div>
);

// Flow output display component
export const FlowOutputDisplay: React.FC<{ output: FlowOutput | null }> = ({ output }) => {
  if (!output) return null;

  return (
    <div style={{
      background: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '12px',
      margin: '8px 0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <strong>{output.orgUsrNode}</strong>
        <span style={{ fontSize: '12px', color: '#666' }}>
          {new Date(output.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
        Topic: {output.topic}
      </div>
      <pre style={{
        background: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        maxHeight: '200px',
        overflow: 'auto',
        margin: 0
      }}>
        {typeof output.data === 'string' ? output.data : JSON.stringify(output.data, null, 2)}
      </pre>
    </div>
  );
};

// Main integration component for your workflow builder
interface WorkflowKafkaIntegrationProps {
  workflowName?: string;
  onFlowOutput?: (output: FlowOutput) => void;
  updateNodeData?: (nodeId: string, key: string, value: any) => void;
}

export const WorkflowKafkaIntegration: React.FC<WorkflowKafkaIntegrationProps> = observer(({
  workflowName,
  onFlowOutput,
  updateNodeData
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Use the specialized workflow hook
  const {
    isConnected,
    latestOutput,
    allOutputs,
    error,
    totalOutputs,
    topicCount,
    connect,
    disconnect,
    requestLatestOutputs,
    isOutputForWorkflow
  } = useWorkflowKafkaData(
    workflowName,
    workflowsStore.organizationName,
    workflowsStore.userName
  );

  // Handle new flow outputs
  useEffect(() => {
    if (latestOutput) {
      // Call parent callback
      onFlowOutput?.(latestOutput);
      
      // Update workflow nodes if function provided
      if (updateNodeData && isOutputForWorkflow(latestOutput)) {
        // Find the node that should receive this output
        // This depends on your node structure
        const targetNodeId = findTargetNodeForOutput(latestOutput);
        if (targetNodeId) {
          updateNodeData(targetNodeId, 'outputData', latestOutput.data);
          updateNodeData(targetNodeId, 'lastKafkaUpdate', latestOutput.timestamp);
        }
      }
    }
  }, [latestOutput, onFlowOutput, updateNodeData, isOutputForWorkflow]);

  // Helper function to find which node should receive the output
  const findTargetNodeForOutput = (output: FlowOutput): string | null => {
    // This is workflow-specific logic
    // You might need to parse the topic name or use other metadata
    // to determine which node should receive this output
    
    // Example: if topic is "org-user-workflow-ocr-topic", target the OCR node
    const topicParts = output.topic.split('-');
    const nodeType = topicParts[topicParts.length - 2]; // Get the part before "topic"
    
    // Find node by type in your workflow
    // This depends on how your nodes are structured
    return `${nodeType}_node_id`; // Return actual node ID
  };

  return (
    <div style={{ margin: '10px 0' }}>
      {/* Connection Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <KafkaConnectionStatus isConnected={isConnected} error={error} />
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {totalOutputs > 0 && (
            <span style={{ fontSize: '12px', color: '#666' }}>
              {totalOutputs} outputs from {topicCount} topics
            </span>
          )}
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'none',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          
          {!isConnected && (
            <button
              onClick={connect}
              style={{
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '12px',
          marginTop: '8px',
          background: '#fafafa'
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => requestLatestOutputs(10)}
              disabled={!isConnected}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                opacity: isConnected ? 1 : 0.6
              }}
            >
              Refresh (10)
            </button>
            
            <button
              onClick={() => requestLatestOutputs(50)}
              disabled={!isConnected}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                opacity: isConnected ? 1 : 0.6
              }}
            >
              Load More (50)
            </button>
          </div>

          {/* Latest Output */}
          {latestOutput && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Latest Output:</h4>
              <FlowOutputDisplay output={latestOutput} />
            </div>
          )}

          {/* Recent Outputs */}
          {allOutputs.length > 0 && (
            <div>
              <h4 style={{ margin: '16px 0 8px 0', fontSize: '14px' }}>
                Recent Outputs ({allOutputs.length}):
              </h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {allOutputs.slice(0, 5).map((output, index) => (
                  <FlowOutputDisplay 
                    key={`${output.topic}-${output.offset}-${index}`} 
                    output={output} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});