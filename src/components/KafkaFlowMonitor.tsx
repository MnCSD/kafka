import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useKafkaFlowData } from '../hooks/useKafkaFlowData.js';
import { FlowOutput } from '../services/KafkaOutputMonitor.js';
import './KafkaFlowMonitor.css';

interface KafkaFlowMonitorProps {
  onFlowOutput?: (output: FlowOutput) => void;
  orgUsrNode?: string;
  className?: string;
}

export const KafkaFlowMonitor: React.FC<KafkaFlowMonitorProps> = observer(({
  onFlowOutput,
  orgUsrNode,
  className = ''
}) => {
  const {
    isConnected,
    latestOutput,
    allOutputs,
    monitoringStatus,
    error,
    connect,
    disconnect,
    requestLatestOutputs,
    monitorSpecificOrg
  } = useKafkaFlowData();

  const [isExpanded, setIsExpanded] = useState(false);

  // Call callback when new output arrives
  useEffect(() => {
    if (latestOutput && onFlowOutput) {
      onFlowOutput(latestOutput);
    }
  }, [latestOutput, onFlowOutput]);

  // Monitor specific org if provided
  useEffect(() => {
    if (isConnected && orgUsrNode) {
      monitorSpecificOrg(orgUsrNode);
    }
  }, [isConnected, orgUsrNode, monitorSpecificOrg]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatData = (data: any) => {
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className={`kafka-flow-monitor ${className}`}>
      <div className="monitor-header">
        <div className="monitor-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>Kafka Flow Monitor</span>
          {monitoringStatus && (
            <span className="topic-count">
              ({monitoringStatus.topicCount} topics, {monitoringStatus.totalOutputs} outputs)
            </span>
          )}
        </div>
        
        <div className="monitor-controls">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="expand-button"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          
          {!isConnected ? (
            <button onClick={connect} className="connect-button">
              Connect
            </button>
          ) : (
            <button onClick={disconnect} className="disconnect-button">
              Disconnect
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          ❌ Error: {error}
        </div>
      )}

      {isExpanded && (
        <div className="monitor-content">
          {latestOutput && (
            <div className="latest-output">
              <h4>Latest Output</h4>
              <div className="output-item">
                <div className="output-header">
                  <span className="org-usr-node">{latestOutput.orgUsrNode}</span>
                  <span className="timestamp">{formatTimestamp(latestOutput.timestamp)}</span>
                </div>
                <div className="output-topic">Topic: {latestOutput.topic}</div>
                <div className="output-data">
                  <pre>{formatData(latestOutput.data)}</pre>
                </div>
              </div>
            </div>
          )}

          <div className="controls">
            <button 
              onClick={() => requestLatestOutputs(10)}
              disabled={!isConnected}
            >
              Refresh Latest (10)
            </button>
            <button 
              onClick={() => requestLatestOutputs(50)}
              disabled={!isConnected}
            >
              Load More (50)
            </button>
          </div>

          {allOutputs.length > 0 && (
            <div className="all-outputs">
              <h4>Recent Outputs ({allOutputs.length})</h4>
              <div className="outputs-list">
                {allOutputs.slice(0, 10).map((output, index) => (
                  <div key={`${output.topic}-${output.offset}-${index}`} className="output-item">
                    <div className="output-header">
                      <span className="org-usr-node">{output.orgUsrNode}</span>
                      <span className="timestamp">{formatTimestamp(output.timestamp)}</span>
                    </div>
                    <div className="output-topic">Topic: {output.topic}</div>
                    <div className="output-data">
                      <pre>{formatData(output.data)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});