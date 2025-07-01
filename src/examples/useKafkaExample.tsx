import React, { useEffect } from 'react';
import { useKafkaFlowData, useWorkflowKafkaData } from '../hooks/useKafkaFlowData.js';

// Example 1: Basic usage
export const BasicKafkaExample: React.FC = () => {
  const {
    isConnected,
    latestOutput,
    allOutputs,
    error,
    connect,
    disconnect,
    requestLatestOutputs
  } = useKafkaFlowData();

  useEffect(() => {
    if (latestOutput) {
      console.log('New output received:', latestOutput);
    }
  }, [latestOutput]);

  return (
    <div>
      <h3>Basic Kafka Integration</h3>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      <div>
        <button onClick={connect} disabled={isConnected}>Connect</button>
        <button onClick={disconnect} disabled={!isConnected}>Disconnect</button>
        <button onClick={() => requestLatestOutputs(10)} disabled={!isConnected}>
          Get Latest 10
        </button>
      </div>

      {latestOutput && (
        <div>
          <h4>Latest Output:</h4>
          <pre>{JSON.stringify(latestOutput, null, 2)}</pre>
        </div>
      )}

      <p>Total outputs received: {allOutputs.length}</p>
    </div>
  );
};

// Example 2: Workflow-specific usage
export const WorkflowKafkaExample: React.FC = () => {
  const {
    isConnected,
    latestOutput,
    error,
    workflowName,
    orgUsrNode,
    isOutputForWorkflow
  } = useWorkflowKafkaData('my-test-workflow', 'my-org', 'my-user');

  useEffect(() => {
    if (latestOutput && isOutputForWorkflow(latestOutput)) {
      console.log(`Output for workflow ${workflowName}:`, latestOutput);
      // Update your workflow nodes here
    }
  }, [latestOutput, workflowName, isOutputForWorkflow]);

  return (
    <div>
      <h3>Workflow-Specific Kafka Integration</h3>
      <p>Monitoring: {orgUsrNode}</p>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {latestOutput && isOutputForWorkflow(latestOutput) && (
        <div>
          <h4>Latest Output for {workflowName}:</h4>
          <pre>{JSON.stringify(latestOutput, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Example 3: Custom callback usage
export const CustomCallbackExample: React.FC = () => {
  const kafkaData = useKafkaFlowData('ws://localhost:8080', {
    onFlowOutput: (output) => {
      console.log('Custom callback - new output:', output);
      // Custom logic here
      if (output.data.status === 'completed') {
        alert(`Workflow ${output.orgUsrNode} completed!`);
      }
    },
    onError: (error) => {
      console.error('Custom error handler:', error);
    },
    orgUsrNode: 'specific-org-user-workflow' // Monitor specific workflow
  });

  return (
    <div>
      <h3>Custom Callback Example</h3>
      <p>Status: {kafkaData.isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Monitoring: specific-org-user-workflow</p>
      <p>Total outputs: {kafkaData.totalOutputs}</p>
    </div>
  );
};