# Kafka Service

A simplified Kafka service for managing topics with the pattern `org-usr-flw-node-topic`.

## Features

- **Admin Service**: Create, list, and manage Kafka topics
- **Consumer Service**: Subscribe to and consume messages from topics
- **Producer Service**: Send messages to topics
- **No SSL/SASL**: Simplified configuration without certificates
- **Topic Pattern**: Designed for `org-usr-flw-node-topic` pattern where `org-usr-node` is dynamic

## Installation

```bash
npm install
```

## Configuration

Update the Kafka broker addresses in `src/config/kafkaConfig.ts`:

```typescript
export const defaultKafkaConfig = createKafkaConfig(
  ['your-kafka-broker:9092'], // Update this
  'kafka-service',
  'kafka-service-group'
);
```

## Usage

### Basic Example

```typescript
import { KafkaAdminService, createKafkaConfig } from './src/index.js';

const config = createKafkaConfig(['localhost:9092']);
const adminService = new KafkaAdminService(config);

// Get all flow topics
const flowTopics = await adminService.getFlowTopics();
console.log('Flow topics:', flowTopics);

// Get topics for specific org-usr-node
const specificTopics = await adminService.getFlowTopics('myorg-myuser-mynode');
console.log('Specific topics:', specificTopics);

// Create a new flow topic
await adminService.createFlowTopic('neworg-newuser-newnode');
```

### Consumer Example

```typescript
import { KafkaConsumerService } from './src/services/KafkaConsumerService.js';

const consumerService = new KafkaConsumerService(config);

consumerService.on('message', (messageData) => {
  console.log('Received:', messageData);
});

await consumerService.subscribe(['myorg-myuser-mynode-topic']);
```

### Producer Example

```typescript
import { KafkaProducerService } from './src/services/KafkaProducerService.js';

const producerService = new KafkaProducerService(config);

await producerService.sendToFlowTopic('myorg-myuser-mynode', {
  type: 'flow-data',
  payload: { message: 'Hello World!' }
});
```

## Scripts

- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run the built application
- `npm test` - Test Kafka connection

## Testing Connection

Run the connection test to verify your Kafka setup:

```bash
npm test
```

This will:
1. Test connection to Kafka
2. List existing topics
3. Create a test topic
4. Verify the topic was created

## API Reference

### KafkaAdminService

- `getFlowTopics(orgUsrNode?: string)` - Get topics matching the flow pattern
- `getAllTopics()` - Get all topics
- `createFlowTopic(orgUsrNode: string)` - Create a new flow topic
- `deleteTopic(topicName: string)` - Delete a topic
- `getTopicMetadata(topicNames: string[])` - Get topic metadata

### KafkaConsumerService

- `subscribe(topics: string[])` - Subscribe to topics
- `subscribeToFlowTopics(orgUsrNode?: string)` - Subscribe to flow topics
- `disconnect()` - Disconnect consumer

Events:
- `message` - New message received
- `topic:${topicName}` - Topic-specific messages
- `connected` - Consumer connected
- `disconnected` - Consumer disconnected
- `error` - Error occurred

### KafkaProducerService

- `sendMessage(topic: string, message: string | object, key?: string)` - Send single message
- `sendToFlowTopic(orgUsrNode: string, message: string | object, key?: string)` - Send to flow topic
- `sendBatch(topic: string, messages: Array<{value: string | object; key?: string}>)` - Send batch
- `disconnect()` - Disconnect producer

## Topic Pattern

Topics follow the pattern: `{org}-{usr}-{flw}-{node}-topic`

Example: `mycompany-john-workflow-node1-topic`

Where:
- `org`: Organization identifier
- `usr`: User identifier  
- `flw`: Flow identifier (always "flw")
- `node`: Node identifier
- `topic`: Fixed suffix (always "topic")