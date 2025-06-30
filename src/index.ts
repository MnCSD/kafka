import { KafkaAdminService } from './services/KafkaAdminService.js';
import { KafkaConsumerService } from './services/KafkaConsumerService.js';
import { KafkaProducerService } from './services/KafkaProducerService.js';
import { defaultKafkaConfig, createKafkaConfig } from './config/kafkaConfig.js';

// Example usage
async function main() {
  try {
    // Create services with default config
    const adminService = new KafkaAdminService(defaultKafkaConfig);
    const consumerService = new KafkaConsumerService(defaultKafkaConfig);
    const producerService = new KafkaProducerService(defaultKafkaConfig);

    // Example: Get all flow topics
    console.log('Getting all flow topics...');
    const flowTopics = await adminService.getFlowTopics();
    console.log('Flow topics found:', flowTopics);

    // Example: Get topics for specific org-usr-node
    const specificTopics = await adminService.getFlowTopics('myorg-myuser-mynode');
    console.log('Specific topics found:', specificTopics);

    // Example: Create a new flow topic
    console.log('Creating new flow topic...');
    await adminService.createFlowTopic('testorg-testuser-testnode');

    // Example: Set up consumer
    consumerService.on('message', (messageData) => {
      console.log('Received message:', messageData);
    });

    consumerService.on('connected', () => {
      console.log('Consumer is ready to receive messages');
    });

    // Subscribe to flow topics
    await consumerService.subscribe(['testorg-testuser-testnode-topic']);

    // Example: Send a message
    await producerService.sendToFlowTopic('testorg-testuser-testnode', {
      type: 'test',
      data: 'Hello from Kafka service!',
      timestamp: new Date().toISOString()
    });

    // Keep the process running
    console.log('Kafka service is running. Press Ctrl+C to exit.');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await consumerService.disconnect();
      await producerService.disconnect();
      await adminService.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

// Export services for use in other modules
export { KafkaAdminService, KafkaConsumerService, KafkaProducerService };
export { createKafkaConfig, defaultKafkaConfig } from './config/kafkaConfig.js';

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}