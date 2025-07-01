import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { KafkaFlowMonitor } from './KafkaFlowMonitor';
import { FlowOutput } from '../services/KafkaOutputMonitor.js';
import { workflowsStore } from '../stores';

interface EnhancedWorkflowBuilderProps {
  // Your existing props
}

export const EnhancedWorkflowBuilder: React.FC<EnhancedWorkflowBuilderProps> = observer(() => {
  const [recentFlowOutputs, setRecentFlowOutputs] = useState<FlowOutput[]>([]);
  const [selectedWorkflowOutput, setSelectedWorkflowOutput] = useState<FlowOutput | null>(null);

  // Get the current workflow name for monitoring
  const currentWorkflowName = workflowsStore.selectedWorkflowName;
  const orgUsrNode = currentWorkflowName ? `${workflowsStore.organizationName}-${workflowsStore.userName}-${currentWorkflowName}` : undefined;

  const handleFlowOutput = (output: FlowOutput) => {
    console.log('📨 New flow output received:', output);
    
    // Update recent outputs
    setRecentFlowOutputs(prev => [output, ...prev.slice(0, 9)]); // Keep last 10
    
    // If this output is for the currently selected workflow, highlight it
    if (currentWorkflowName && output.orgUsrNode.includes(currentWorkflowName)) {
      setSelectedWorkflowOutput(output);
      
      // Update the workflow store with the new data
      workflowsStore.updateWorkflowOutput(output);
    }
  };

  const updateNodeWithKafkaData = (nodeId: string, kafkaData: any) => {
    // Update the specific node with Kafka data
    workflowsStore.updateNodeData(nodeId, 'kafkaOutput', kafkaData);
    workflowsStore.updateNodeData(nodeId, 'lastUpdated', new Date().toISOString());
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Kafka Flow Monitor */}
      <KafkaFlowMonitor
        onFlowOutput={handleFlowOutput}
        orgUsrNode={orgUsrNode}
        className="workflow-kafka-monitor"
      />

      {/* Your existing workflow builder content */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Left panel with workflow controls */}
        <div style={{ width: '300px', padding: '16px', borderRight: '1px solid #ccc' }}>
          {/* Your existing left panel content */}
          
          {/* Recent Flow Outputs Panel */}
          {recentFlowOutputs.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Recent Flow Outputs</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {recentFlowOutputs.map((output, index) => (
                  <div 
                    key={`${output.topic}-${output.offset}-${index}`}
                    style={{
                      padding: '8px',
                      margin: '4px 0',
                      background: selectedWorkflowOutput?.offset === output.offset ? '#e3f2fd' : '#f5f5f5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    onClick={() => setSelectedWorkflowOutput(output)}
                  >
                    <div style={{ fontWeight: 'bold' }}>{output.orgUsrNode}</div>
                    <div style={{ color: '#666' }}>
                      {new Date(output.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main workflow canvas */}
        <div style={{ flex: 1 }}>
          {/* Your existing ReactFlow component */}
          {/* The nodes will automatically update when workflowsStore.updateNodeData is called */}
        </div>

        {/* Right panel for output details */}
        {selectedWorkflowOutput && (
          <div style={{ width: '300px', padding: '16px', borderLeft: '1px solid #ccc' }}>
            <h4>Flow Output Details</h4>
            <div>
              <strong>Workflow:</strong> {selectedWorkflowOutput.orgUsrNode}
            </div>
            <div>
              <strong>Topic:</strong> {selectedWorkflowOutput.topic}
            </div>
            <div>
              <strong>Time:</strong> {new Date(selectedWorkflowOutput.timestamp).toLocaleString()}
            </div>
            <div style={{ marginTop: '12px' }}>
              <strong>Data:</strong>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px',
                fontSize: '12px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {JSON.stringify(selectedWorkflowOutput.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});