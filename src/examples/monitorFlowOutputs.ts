import { KafkaOutputMonitor } from '../services/KafkaOutputMonitor.js';
import { createKafkaConfig } from '../config/kafkaConfig.js';

async function monitorFlowOutputs() {
  console.log('🚀 Starting Flow Output Monitor Example');
  
  // Create configuration
  const config = createKafkaConfig(
    ['localhost:9092'], // Update with your Kafka brokers
    'flow-output-monitor',
    'flow-output-monitor-group'
  );

  // Create monitor
  const monitor = new KafkaOutputMonitor(config, 500); // Keep last 500 outputs

  // Set up event listeners
  monitor.on('flow-output', (output) => {
    console.log(`\n📨 New flow output from ${output.orgUsrNode}:`);
    console.log(`   Topic: ${output.topic}`);
    console.log(`   Time: ${output.timestamp}`);
    console.log(`   Data:`, JSON.stringify(output.data, null, 2));
  });

  monitor.on('monitoring-started', ({ topics }) => {
    console.log(`\n✅ Monitoring started for ${topics.length} topics`);
    console.log('Topics:', topics);
  });

  monitor.on('monitor-error', (error) => {
    console.error('\n❌ Monitor error:', error);
  });

  // Example: Monitor specific org-usr-node
  monitor.on('output:myorg-myuser-mynode', (output) => {
    console.log(`\n🎯 Specific output from myorg-myuser-mynode:`, output.data);
  });

  try {
    // Start monitoring all flow topics
    console.log('\n🔍 Starting to monitor all flow topics...');
    await monitor.startMonitoring();

    // Show status every 30 seconds
    const statusInterval = setInterval(() => {
      const status = monitor.getMonitoringStatus();
      const stats = monitor.getTopicStatistics();
      
      console.log('\n📊 Monitoring Status:');
      console.log(`   Active: ${status.isMonitoring}`);
      console.log(`   Total outputs received: ${status.totalOutputs}`);
      console.log(`   Topics monitored: ${status.topicCount}`);
      
      if (stats.length > 0) {
        console.log('\n📈 Topic Statistics:');
        stats.forEach(stat => {
          console.log(`   ${stat.topic}: ${stat.messageCount} messages`);
          if (stat.lastMessageTime) {
            console.log(`     Last message: ${stat.lastMessageTime}`);
          }
        });
      }
    }, 30000);

    // Example: Get latest outputs every minute
    const outputInterval = setInterval(() => {
      const latest = monitor.getLatestOutputs(5);
      if (latest.length > 0) {
        console.log('\n🕐 Latest 5 outputs:');
        latest.forEach((output, index) => {
          console.log(`   ${index + 1}. ${output.orgUsrNode} at ${output.timestamp}`);
        });
      }
    }, 60000);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down monitor...');
      clearInterval(statusInterval);
      clearInterval(outputInterval);
      
      // Show final statistics
      const finalStats = monitor.getTopicStatistics();
      const allOutputs = monitor.getAllOutputs();
      
      console.log('\n📋 Final Statistics:');
      console.log(`   Total outputs processed: ${allOutputs.length}`);
      finalStats.forEach(stat => {
        console.log(`   ${stat.topic}: ${stat.messageCount} messages`);
      });
      
      await monitor.disconnect();
      console.log('👋 Monitor shutdown complete');
      process.exit(0);
    });

    console.log('\n🎯 Monitor is running. Press Ctrl+C to stop.');
    console.log('💡 Upload files and run NiFi flows to see outputs here!');

  } catch (error) {
    console.error('❌ Failed to start monitoring:', error);
    await monitor.disconnect();
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  monitorFlowOutputs();
}

export { monitorFlowOutputs };