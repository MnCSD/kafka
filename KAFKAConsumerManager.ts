import { log } from "../logStashServices/sendLog";
import KAFKACameraConsumer from "./KAFKACameraConsumer";
import { consumerConfig } from './KAFKAConsumerConnectionConfig';


export let totalConsumers = 0;


export function getCameraConsumer(cameraId: string) {
    totalConsumers++;
    log('INFO', 'KAFKA_CONSUMER_MANAGER', `Total Consumers: ${totalConsumers}`, true);

    return new KAFKACameraConsumer(consumerConfig.connectionConfig, cameraId)
}

export function releaseCameraConsumer(kafkaCameraConsumer: KAFKACameraConsumer) {
    totalConsumers--;
    log('INFO', 'KAFKA_CONSUMER_MANAGER', `Total Consumers: ${totalConsumers}`, true);

    kafkaCameraConsumer.destroy();
}

