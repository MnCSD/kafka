import { EventEmitter } from "node:events";
import { Kafka, ConsumerSubscribeTopics, EachMessagePayload, Consumer, KafkaConfig } from "kafkajs";
import { convertDetectionObject } from "../messageServices/alarms/detectionMessages";
import { convertAssociationObject } from "../messageServices/alarms/associationMessages";
import { kafkaAdminInstance } from "./KAFKAadminService";
import { log } from "../logStashServices/sendLog";

const COMPONENT_NAME = "KAFKA_CAMERA_CONSUMER";

type WebsocketMessage = {
    topic: string,
    data: any
}

class KAFKACameraConsumer extends EventEmitter {
    private consumer: Consumer
    private readonly cameraID: string

    public constructor(kafkaConfig: KafkaConfig, cameraID: string) {
        super()

        this.cameraID = cameraID;

        this.consumer = this.createKafkaConsumer(kafkaConfig);
        this.initialConnection();
    }

    private get topics() {
        const { cameraID } = this;

        return [
            cameraID + '_detections',
            cameraID + '_associations',
        ]
    }


    private createKafkaConsumer(kafkaConfig: KafkaConfig): Consumer {
        const kafka = new Kafka({
            ...kafkaConfig,
            retry: {
                retries: Infinity,
            },
        })

        const consumer = kafka.consumer({
            groupId: COMPONENT_NAME + '_' + Math.random().toString(36).substring(5)
        },)

        consumer.on('consumer.network.request_timeout', async (err) => {
            log('ERROR', COMPONENT_NAME, JSON.stringify(err), true);
        })
        consumer.on('consumer.disconnect', async (err) => {
            log('ERROR', COMPONENT_NAME, JSON.stringify(err), true);
        })
        consumer.on('consumer.crash', async (err) => {
            log('ERROR', COMPONENT_NAME, JSON.stringify(err), true);
        })

        return consumer
    }

    private async initialConnection() {

        try {
            await this.consumer.connect()

            await kafkaAdminInstance.createCameraDataTopics(this.cameraID);

            await this.consumer.subscribe({
                topics: this.topics,
                fromBeginning: false,
            });

            await this.consumer.run({
                eachMessage: this.eachMessage
            })

        } catch (err) {
            log('ERROR', COMPONENT_NAME, JSON.stringify(err), true);
        }

    }

    protected eachMessage = async (messagePayload: EachMessagePayload) => {
        const { topic, partition, message } = messagePayload

        if (!message.value)
            return;

        if (topic.includes('_detections')) {
            const detectionEvent = convertDetectionObject(message.value);

            if (detectionEvent) {
                this.emit('detection', detectionEvent)
            }
        }
        else if (topic.includes('_associations')) {
            const associationEvent = convertAssociationObject(message.value);

            if (associationEvent) {
                this.emit('association', associationEvent)
            }
        }
    }

    async destroy() {
        try {
            await this.consumer?.disconnect();
        } catch (err) {
            log('ERROR', COMPONENT_NAME, JSON.stringify(err), true);
        }
    }
}

interface KAFKACameraConsumer {
    on(event: 'detection', listener: (data: WebsocketMessage) => void): this;
    emit(event: 'detection', data: any): boolean;

    on(event: 'association', listener: (data: WebsocketMessage) => void): this;
    emit(event: 'association', data: any): boolean;
}

export default KAFKACameraConsumer