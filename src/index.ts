import { KafkaAdminService } from './services/KafkaAdminService.js';
import { KafkaConsumerService } from './services/KafkaConsumerService.js';
import { KafkaProducerService } from './services/KafkaProducerService.js';
import { KafkaOutputMonitor } from './services/KafkaOutputMonitor.js';
import { defaultKafkaConfig, createKafkaConfig } from './config/kafkaConfig.js';

// Example usage focused on monitoring flow outputs
async function main() {
  try {
    console.log('🚀 Kafka Flow Output Service');
    
    // Create output monitor
    const monitor = new KafkaOutputMonitor(defaultKafkaConfig, 1000);

    // Set up monitoring events
    monitor.on('flow-output', (output) => {
      console.log(`📥 Flow output from ${output.orgUsrNode}:`, {
        topic: output.topic,
        timestamp: output.timestamp,
        hasData: !!output.data
      });
    });

    monitor.on('monitoring-started', ({ topics }) => {
      console.log(`✅ Monitoring ${topics.length} flow topics`);
    });

    // Start monitoring all flow topics
    console.log('🔍 Starting flow output monitoring...');
    await monitor.startMonitoring();

    // Show status periodically
    setInterval(() => {
      const status = monitor.getMonitoringStatus();
      if (status.totalOutputs > 0) {
        console.log(`📊 Status: ${status.totalOutputs} outputs from ${status.topicCount} topics`);
      }
    }, 30000);

    console.log('🎯 Service is running. Upload files and run NiFi flows to see outputs!');
    console.log('💡 Press Ctrl+C to stop');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await monitor.disconnect();
      console.log('👋 Shutdown complete');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error in main:', error);
    process.exit(1);
  }
}

// Export services for use in other modules
export { KafkaAdminService, KafkaConsumerService, KafkaProducerService, KafkaOutputMonitor };
export { createKafkaConfig, defaultKafkaConfig } from './config/kafkaConfig.js';

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}