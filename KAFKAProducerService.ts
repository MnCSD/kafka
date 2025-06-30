import { Kafka, KafkaConfig, Producer, ProducerRecord } from 'kafkajs'
import { ProducerConfig } from './KAFKAProducerConnectionConfig'
import { tcpClient } from '../logStashServices/sendLog'

export interface KafkaConfigInterface {
    topicName: string
    connectionConfig: KafkaConfig,
    groupid: string
}

export default class KafkaProducerService {
    private _kafkaConfig: KafkaConfig
    private _producer: Promise<Producer>

    constructor(kafkaConfig: { connectionConfig: KafkaConfig, groupid: string }) {
        this._kafkaConfig = kafkaConfig.connectionConfig;
    }

    private getProducer(): Promise<Producer> {
        if (this._producer)
            return this._producer;

        this._producer = new Promise<Producer>((resolve, reject) => {
            const kafka = new Kafka(this._kafkaConfig);
            const producer = kafka.producer();

            producer.connect().catch((err) => {
                console.error("KAFKA PRODUCER CONNECTION ERROR ", err);
                reject(err);
            });

            producer.on('producer.connect', () => {
                console.log("KAFKA PRODUCER CONNECTED");
                resolve(producer);
            });

            producer.on('producer.disconnect', (err) => {
                console.log("KAFKA PRODUCER DISCONNECTED");
                reject(err);
            });

        });

        return this._producer;
    }

    private attemptProducerReconnect() {
        this._producer = new Promise<Producer>((resolve, reject) => {
            const kafka = new Kafka(this._kafkaConfig);
            const producer = kafka.producer();

            producer.connect().catch((err) => {
                console.error("KAFKA PRODUCER CONNECTION ERROR ", err);
                reject(err);
            });

            producer.on('producer.connect', () => {
                console.log("KAFKA PRODUCER CONNECTED");
                resolve(producer);
            });

            producer.on('producer.disconnect', (err) => {
                console.log("KAFKA PRODUCER DISCONNECTED");
                reject(err);
            });

        });

        return this._producer;
    }

    public async sendBatch(message: any, topic: string, key?: string) {
        let remainingAttempts = 3;
        let currErr;

        const kafkaMessage =
            key ?
                {
                    key,
                    value: message
                }
                :
                {
                    value: message
                }

        const topicMessages: any = {
            topic,
            messages: [kafkaMessage],
        }

        while (remainingAttempts > 0) {
            try {
                let producer;

                if (remainingAttempts < 3) {
                    producer = await this.attemptProducerReconnect();
                }
                else {
                    producer = await this.getProducer();
                }

                const batch: ProducerRecord = topicMessages

                await producer.send(batch)

                return true;
            } catch (err) {
                console.error("FAILED TO SEND MESSAGE TO KAFKA ", err);
                tcpClient.sendMessage("Error in kafka Producer when trying to send message: " + JSON.stringify(err), "ERROR", "Kafka-Producer")

                await new Promise(resolve => setTimeout(resolve, 10000));
                remainingAttempts--;
                console.log("ATTEMPTING TO RESEND MESSAGE TO KAFKA");
                currErr = err;
            }

        }

        console.error("STOPPED ATTEMPTS TO SEND TO KAFKA");

        return currErr;
    }
}

export const producerInstance = new KafkaProducerService(ProducerConfig)
