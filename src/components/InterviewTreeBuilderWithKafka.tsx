import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { WorkflowKafkaIntegration } from './WorkflowKafkaIntegration.js';
import { FlowOutput } from '../services/KafkaOutputMonitor.js';
import { workflowsStore } from '../stores';

// Enhanced version of your existing InterviewTreeBuilderFlowTest component
export const InterviewTreeBuilderWithKafka: React.FC = observer(() => {
  // Your existing state and logic here...
  // const [nodes, setNodes] = useState<Node[]>([]);
  // const [edges, setEdges] = useState<Edge[]>([]);
  // ... etc

  // Kafka integration
  const handleKafkaFlowOutput = useCallback((output: FlowOutput) => {
    console.log('📨 Received Kafka flow output:', output);
    
    // Update workflow store with the output
    workflowsStore.updateWorkflowWithKafkaOutput(output);
    
    // You can also trigger UI updates, notifications, etc.
    // notificationsStore.pushNotification({
    //   type: 'info',
    //   title: 'Flow Output Received',
    //   description: `Output from ${output.orgUsrNode}`
    // });
  }, []);

  const updateNodeData = useCallback((nodeId: string, key: string, value: any) => {
    // Your existing updateNodeData logic
    // setNodes((prevNodes) =>
    //   prevNodes.map((node) => {
    //     if (node.id === nodeId) {
    //       return {
    //         ...node,
    //         data: {
    //           ...node.data,
    //           [key]: value,
    //         },
    //       };
    //     }
    //     return node;
    //   })
    // );
  }, []);

  // Get current workflow name for Kafka monitoring
  const currentWorkflowName = workflowsStore.selectedWorkflowName || 
                              workflowsStore.workflowBeingEdited?.name;

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Kafka Integration Component */}
      <WorkflowKafkaIntegration
        workflowName={currentWorkflowName}
        onFlowOutput={handleKafkaFlowOutput}
        updateNodeData={updateNodeData}
      />

      {/* Your existing workflow builder UI */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Left panel */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgb(137, 133, 133)',
          borderRadius: '4px'
        }}>
          {/* Your existing left panel content */}
          {/* Flow mode switch, workflow name input, buttons, etc. */}
        </div>

        {/* Main ReactFlow area */}
        <div style={{ width: '100%', height: '100%' }}>
          {/* Your existing ReactFlow component */}
          {/* 
          <ReactFlow
            id="tree-builder"
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onNodeClick={onNodeClick}
            onInit={(v) => (reactFlowInstance.current = v)}
            ref={reactFlowWrapper}
          >
            <MiniMap
              nodeColor={workflowsStore.getNodeColorCB}
              nodeStrokeWidth={3}
              zoomable
              pannable
              style={{ background: 'grey' }}
              nodeStrokeColor="white"
            />
          </ReactFlow>
          */}
        </div>
      </div>
    </div>
  );
});