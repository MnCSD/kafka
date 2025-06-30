# Kafka Flow Output Monitor

A Kafka service designed to monitor and capture outputs from NiFi flows using the topic pattern `org-usr-flw-node-topic`.

## User Flow

1. **User uploads a file** (JSON)
2. **NiFi processes the flows** 
3. **Monitor captures outputs** from Kafka topics automatically

## Features

- **Output Monitor**: Automatically discovers and monitors all flow topics
- **Real-time Processing**: Captures outputs as they arrive from NiFi
- **Pattern Matching**: Works with `org-usr-flw-node-topic` pattern
- **Statistics**: Tracks message counts and timing per topic
- **Flexible Filtering**: Monitor all topics or specific org-usr-node combinations
- **No SSL/SASL**: Simplified configuration

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Kafka
Update broker addresses in `src/config/kafkaConfig.ts`:
```typescript
export const defaultKafkaConfig = createKafkaConfig(
  ['your-kafka-broker:9092'], // Update this
  'kafka-service',
  'kafka-service-group'
);
```

### 3. Test Connection
```bash
npm test
```

### 4. Start Monitoring
```bash
# Monitor all flow topics
npm run monitor

# Or monitor specific org-usr-node
npm run monitor-specific
```

## Usage Examples

### Monitor All Flow Outputs
```typescript
import { KafkaOutputMonitor, createKafkaConfig } from './src/index.js';

const config = createKafkaConfig(['localhost:9092']);
const monitor = new KafkaOutputMonitor(config);

// Listen for any flow output
monitor.on('flow-output', (output) => {
  console.log(`Output from ${output.orgUsrNode}:`, output.data);
});

// Start monitoring all topics ending with '-topic'
await monitor.startMonitoring();
```

### Monitor Specific Organization
```typescript
// Monitor only 'mycompany-john-workflow-node1-topic'
await monitor.startMonitoring('mycompany-john-workflow-node1');

// Listen for specific outputs
monitor.on('output:mycompany-john-workflow-node1', (output) => {
  console.log('Specific output:', output.data);
});
```

### Get Statistics
```typescript
// Get all outputs received
const allOutputs = monitor.getAllOutputs();

// Get outputs for specific org-usr-node
const specificOutputs = monitor.getOutputsForOrgUsrNode('mycompany-john-workflow-node1');

// Get topic statistics
const stats = monitor.getTopicStatistics();
console.log('Topics monitored:', stats);

// Get latest outputs
const latest = monitor.getLatestOutputs(10);
```

## API Reference

### KafkaOutputMonitor

#### Methods
- `startMonitoring(orgUsrNode?: string)` - Start monitoring topics
- `stopMonitoring()` - Stop monitoring
- `getAllOutputs()` - Get all captured outputs
- `getOutputsForOrgUsrNode(orgUsrNode: string)` - Get outputs for specific org-usr-node
- `getLatestOutputs(limit: number)` - Get most recent outputs
- `getTopicStatistics()` - Get statistics for all topics
- `clearOutputs()` - Clear stored outputs
- `getMonitoringStatus()` - Get current status

#### Events
- `flow-output` - New output received from any flow
- `output:${orgUsrNode}` - Output from specific org-usr-node
- `topic-output:${topic}` - Output from specific topic
- `monitoring-started` - Monitoring started successfully
- `monitoring-stopped` - Monitoring stopped
- `monitor-error` - Error occurred

### FlowOutput Interface
```typescript
interface FlowOutput {
  topic: string;           // Full topic name
  orgUsrNode: string;      // Extracted org-usr-node part
  timestamp: string;       // ISO timestamp
  data: any;              // Parsed message data
  messageKey?: string;     // Message key if present
  partition: number;       // Kafka partition
  offset: string;         // Message offset
}
```

## Topic Pattern

Topics must follow: `{org}-{usr}-{flw}-{node}-topic`

Examples:
- `mycompany-john-workflow-node1-topic`
- `acme-alice-dataflow-processor-topic`
- `org1-user2-etl-transform-topic`

## Scripts

- `npm run dev` - Development mode with hot reload
- `npm run build` - Build TypeScript
- `npm start` - Run built application
- `npm test` - Test Kafka connection
- `npm run monitor` - Monitor all flow outputs
- `npm run monitor-specific` - Monitor specific org-usr-node

## Integration with NiFi

1. **Configure NiFi** to publish results to topics with pattern `org-usr-flw-node-topic`
2. **Start monitoring** before processing files
3. **Upload and process** files through NiFi
4. **Outputs appear automatically** in the monitor

## Example Output

```
📥 Flow output from mycompany-john-workflow-node1:
   Topic: mycompany-john-workflow-node1-topic
   Time: 2024-01-15T10:30:45.123Z
   Data: {
     "status": "completed",
     "processedRecords": 1500,
     "outputFile": "processed_data_20240115.json",
     "processingTime": "2.3s"
   }
```

## Troubleshooting

1. **No topics found**: Ensure NiFi is creating topics with the correct pattern
2. **Connection issues**: Verify Kafka broker addresses in config
3. **No outputs**: Check that NiFi is publishing to the monitored topics
4. **Memory usage**: Adjust `maxOutputsToKeep` parameter to limit stored outputs

## Configuration

The service automatically:
- Discovers topics ending with `-topic`
- Extracts `org-usr-node` from topic names
- Parses JSON messages (falls back to string for non-JSON)
- Tracks statistics per topic
- Handles reconnections automatically