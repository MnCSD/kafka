import { KafkaAdminService } from '../services/KafkaAdminService.js';
import { createKafkaConfig } from '../config/kafkaConfig.js';

async function testKafkaConnection() {
  console.log('Testing Kafka connection...');

  // Update these values to match your Kafka setup
  const config = createKafkaConfig(
    ['localhost:9092'], // Your Kafka brokers
    'test-client',
    'test-group'
  );

  const adminService = new KafkaAdminService(config);

  try {
    console.log('Attempting to connect to Kafka...');
    
    // Test connection by getting all topics
    const allTopics = await adminService.getAllTopics();
    console.log('✅ Successfully connected to Kafka!');
    console.log(`Found ${allTopics.length} topics:`, allTopics);

    // Test getting flow topics
    const flowTopics = await adminService.getFlowTopics();
    console.log(`Found ${flowTopics.length} flow topics:`, flowTopics);

    // Test creating a topic
    console.log('Testing topic creation...');
    const testOrgUsrNode = 'testorg-testuser-testnode';
    const created = await adminService.createFlowTopic(testOrgUsrNode);
    
    if (created) {
      console.log('✅ Topic creation test passed');
      
      // Verify the topic was created
      const updatedTopics = await adminService.getFlowTopics(testOrgUsrNode);
      console.log('Updated flow topics:', updatedTopics);
    }

  } catch (error) {
    console.error('❌ Failed to connect to Kafka:', error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure Kafka is running on localhost:9092');
    console.log('2. Update the broker addresses in the config if needed');
    console.log('3. Check if any authentication is required');
  } finally {
    await adminService.disconnect();
    console.log('Test completed');
    process.exit(0);
  }
}

testKafkaConnection();