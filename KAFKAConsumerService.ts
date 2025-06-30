import { KafkaConfig, Consumer, ConsumerSubscribeTopics, Kafka, EachMessagePayload } from 'kafkajs'
import { consumerConfig, testConsumerConfig } from './KAFKAConsumerConnectionConfig'
import { handleNewAlert } from '../messageServices/alarms/alertMesssages'
import { handleAlertPersonSearchRes } from '../messageServices/responses/alertPersonSearchResponse'
import { handleAvataNonBioResponse } from '../messageServices/responses/avatarNonBioResponse'
import { handleMixedBioResponse } from '../messageServices/responses/mixedBioResponse'
import { tcpClient } from '../logStashServices/sendLog'
import { sendOwnerTrackingAlerts } from '../../api/testingServices/ownerTrackingAlerts'
import { sendAvatarResponses } from '../../api/testingServices/avatarNonBio'
import { sendNonBioResponses } from '../../api/testingServices/avatarNonBio'
import { sendBioResponses } from '../../api/testingServices/mixedBio'
import { sendMixedResponses } from '../../api/testingServices/mixedBio'
import { handleVideoAnalyticsConfigurationRes } from '../messageServices/responses/videoAnalyticsConfigurationResponse'
import { EventEmitter } from 'node:events'
import { Logger } from '../../logger'

import { kafkaConsumerEnabled, kafkaTestConsumerEnabled } from '../../CONFIG'

export interface KafkaConfigInterface {
    topicNames: Array<string>
    connectionConfig: KafkaConfig, // may be we will use SSL configuration
    groupid: string
}

export let heartBeatsCache: { data: string } = { data: '[]' }

export default class KAFKAConsumerService extends EventEmitter {
    private kafkaConfig: KafkaConfigInterface;
    private kafkaConsumer: Consumer;
    private currentTopics: ConsumerSubscribeTopics;

    public constructor(kafkaConfig: KafkaConfigInterface) {
        super();

        console.log("KAFKAConsumerService Constructor for topic ", kafkaConfig.topicNames);

        this.kafkaConfig = JSON.parse(JSON.stringify(kafkaConfig));

        kafkaConfig.groupid = kafkaConfig.groupid + '_' + (Math.random() * Math.pow(10, 17));

        console.log("this.kafkaConfig.groupid ", this.kafkaConfig.groupid);

        try {
            this.kafkaConsumer = this.createKafkaConsumer(kafkaConfig);
            this.initialConsumerStart(kafkaConfig.topicNames);
        } catch (e) {
            console.log("ERROR WHEN CREATING KAFKA CONSUMER ", e)
        }
    }

    private getTopicNames(topicNames: Array<string>): false | ConsumerSubscribeTopics {
        try {
            const topic = {
                topics: [...topicNames],
                fromBeginning: false
            }

            return topic;
        }
        catch (error) {
            console.error("Error when trying to get Kafka Consumer topics to subscribe to ", error)
            tcpClient.sendMessage("Error when trying to get Kafka Consumer topics to subscribe to" + error, "ERROR", "Kafka-Consumer")
            Logger.error("Error when trying to get Kafka Consumer topics to subscribe to" + error);

            return false;
        }
    }

    public async attemtToConnectConsumer() {
        try {
            await this.kafkaConsumer.connect()

            await this.kafkaConsumer.subscribe(this.currentTopics)

            await this.kafkaConsumer.run({
                eachMessage: async (messagePayload: EachMessagePayload) => {
                    const { topic, partition, message } = messagePayload

                    if (message.value) {
                        if (topic.includes('_detections')) {
                            this.emit('detections', message.value)
                        }
                        else if (topic.includes('_associations')) {
                            this.emit('associations', message.value)
                        }
                        else {
                            this.emit(topic, message.value)
                        }
                    }

                }
            })

            return true;
        } catch (error) {
            console.error("Error when trying to connect kafka Cosnumers ", error)
            tcpClient.sendMessage("Error in kafka Consumer when trying to connect: " + error, "ERROR", "Kafka-Consumer")
            return false;
        }
    }

    public async initialConsumerStart(topicNames: Array<string>): Promise<void> {
        try {
            let connected = false;
            const topics = this.getTopicNames(topicNames);

            if (topics === false) {
                return;
            }

            this.currentTopics = topics;

            if (topics.topics.length === 0) {
                return;
            }

            while (!connected) {
                console.log("Trying to connect kafka consumer")

                const res = await this.attemtToConnectConsumer();

                if (res) {
                    connected = true;
                }

                await new Promise(resolve => setTimeout(resolve, 20000));
            }
            console.log("KAFKA CONSUMER CONNECTED")
        }
        catch (err) {
            console.error("Error in intial Consumer Start ", err);
        }
    }


    private createKafkaConsumer(kafkaConfig: KafkaConfigInterface): Consumer {
        const kafka = new Kafka(kafkaConfig.connectionConfig)
        const consumer = kafka.consumer({
            groupId: kafkaConfig.groupid,
            retry: {
                initialRetryTime: 100,
                retries: 1000
            }
        },)

        consumer.on('consumer.network.request_timeout', async (err) => {
            try {
                await tcpClient.sendMessage("Kafka Consumer Disconnect " + JSON.stringify(err), "ERROR", "Kafka-Consumer")
                console.log('Kafka Cosnumer Network Request Timeout ', err);
            }
            catch (error) {
                console.error('Error in consumer.network.request_timeout ', error);
            }

        })
        consumer.on('consumer.disconnect', async (err) => {
            try {
                await tcpClient.sendMessage("Kafka Consumer Disconnect " + JSON.stringify(err), "ERROR", "Kafka-Consumer")
                console.log('Kafka Cosnumer Disconnect ', err);
            }
            catch (error) {
                console.error('Error in consumer.disconnect ', error);
            }
        })
        consumer.on('consumer.crash', async (err) => {
            try {
                await tcpClient.sendMessage("Kafka Consumer Crash " + JSON.stringify(err), "ERROR", "Kafka-Consumer")
                console.log('Kafka Cosnumer Crash ', err);
            }
            catch (error) {
                console.error('Error in consumer.crash ', error);
            }
        })

        return consumer
    }
}

export let kafkaConsumerInstanse: KAFKAConsumerService = null;
export let kafkaDetectionConsumerInstanse: KAFKAConsumerService = null;
let kafkaTestConsumerInstanse: KAFKAConsumerService = null;

if (kafkaConsumerEnabled) {
    console.log('STARTING KAFKA CONSUMER');
    console.log('kafkaConsumerEnabled ', kafkaConsumerEnabled);

    kafkaConsumerInstanse = new KAFKAConsumerService(consumerConfig);

    kafkaConsumerInstanse.on('alerts', (message) => {
        console.log("new alert ");
        handleNewAlert(message);
    }).on('alert_person_search_response', (message) => {
        console.log("new alert_person_search_response ");
        handleAlertPersonSearchRes(message);
    }).on('avatar_based_search_response', (message) => {
        console.log("new avatar_based_search_response ");
        handleAvataNonBioResponse(message, 'AVATAR')
    }).on('non_biometric_data_based_search_response', (message) => {
        console.log("new non_biometric_data_based_search_response");
        handleAvataNonBioResponse(message, 'NON-BIO')
    }).on('biometric_data_based_search_response', (message) => {
        console.log("new biometric_data_based_search_response");
        handleMixedBioResponse(message, 'BIO')
    }).on('mixed_data_based_search_response', (message) => {
        console.log("new mixed_data_based_search_response");
        handleMixedBioResponse(message, 'MIXED')
    }).on('video_analytics_configuration_response', (message) => {
        console.log("new video_analytics_configuration_response");
        handleVideoAnalyticsConfigurationRes(message)
    })
}

if (kafkaTestConsumerEnabled) {
    console.log('STARTING KAFKA TEST CONSUMER');

    kafkaTestConsumerInstanse = new KAFKAConsumerService(testConsumerConfig)

    kafkaTestConsumerInstanse
        .on('alert_person_search_request', (message) => {
            console.log("new alert at test Consumer");
            sendOwnerTrackingAlerts(message);
        })
        .on('avatar_based_search_request', (message) => {
            console.log("new avatar non-bio request");
            sendAvatarResponses(message, 'AVATAR');
        })
        .on('non_biometric_data_based_search_request', (message) => {
            console.log("new avatar non-bio request");
            sendNonBioResponses(message, 'NON-BIO')
        })
        .on('mixed_data_based_search_request', (message) => {
            console.log("new mixed data based search request");
            sendMixedResponses(message, 'MIXED');
        })
        .on('biometric_data_based_search_request', (message) => {
            console.log("new avatar bio request");
            sendBioResponses(message, 'BIO')
        })
}