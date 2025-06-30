
import { EachMessagePayload, Kafka } from 'kafkajs';
import { KAFKA_CONFIG } from './config';

(async () => {
    console.log('Kafka consumer test');

    console.log('Creating kafka');
    const kafka = new Kafka(KAFKA_CONFIG);

    console.log('Kafka created');

    console.log('Creating consumer');
    const consumer = kafka.consumer({ groupId: 'engage-test-comsumer' });
    console.log('Consumer created');

    console.log('Connecting consumer');
    await consumer.connect();
    console.log('Consumer connected');

    console.log('Subscribing to topic');
    await consumer.subscribe({
        topics: [
            '00000001-0000-babe-0000-00075f9a506f_detections',
            '00000001-0000-babe-0000-00075f9a506f_frames',
        ],
        fromBeginning: false,
    });
    console.log('Subscribed to topic');

    console.log('Starting consumer');
    await consumer.run({ eachMessage });

    console.log('Consumer started');
    cls();


})();

let totalMessages = 0;

async function eachMessage(payload: EachMessagePayload) {
    totalMessages++;
    if (payload.topic.endsWith('detections')) {
        eachDetection(payload)
    } else if (payload.topic.endsWith('frames')) {
        eachFrame(payload);
    } else {
        console.warn('Unknown topic', payload.topic);
    }

    printStatus();
}

let totalDetections = 0;
let lastDetection = 0;
let maxDetection = 0;
function eachDetection(payload: EachMessagePayload) {
    totalDetections++;

    const data = JSON.parse(payload.message.value.toString());
    lastDetection = data.frame_ts;
    maxDetection = Math.max(maxDetection, data.frame_ts);
}

let totalFrames = 0;
let lastFrame = 0;
function eachFrame(payload: EachMessagePayload) {
    totalFrames++;

    lastFrame = +payload.message.key.toString();
}


function printStatus() {
    // process.stdout.write('\x1Bc');      // Clear screen
    cursorTo(0, 0);
    clearLine();
    console.log(`Total messages:   ${totalMessages}`);

    clearLine(); console.log();

    clearLine();
    console.log(`Total frames:     ${totalFrames}`);
    clearLine();
    console.log(`Last frame:       ${lastFrame}  ${new Date(lastFrame).toISOString()}`);

    clearLine(); console.log();

    clearLine();
    console.log(`Total detections: ${totalDetections}`);
    clearLine();
    console.log(`Last detection:   ${lastDetection}  ${new Date(lastDetection).toISOString()}`);
    clearLine();
    console.log(`Max detection:    ${maxDetection}  ${new Date(maxDetection).toISOString()}`);
}


function cls() { process.stdout.write('\x1Bc'); }
const cursorTo = process.stdout.cursorTo.bind(process.stdout);
const clearLine = process.stdout.clearLine.bind(process.stdout, 0);

// for (let i = 0; i < 100; i++) {
//     process.stdout.cursorTo(0, 0);
//     process.stdout.clearLine(0);
//     // process.stdout.clearLine(0);
//     // process.stdout.write(i.toString());
//     console.log(i)
//     await new Promise(r => setTimeout(r, 1000))
// }