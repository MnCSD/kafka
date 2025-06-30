import * as fs from 'fs'
import { KafkaConfig } from 'kafkajs'
import { KafkaConfigInterface } from './KAFKAConsumerService'
import { kafkaHosts } from '../../CONFIG'

export const consumerConfig: KafkaConfigInterface = {
    topicNames: ['alerts', 'alert_person_search_response',
        // 'detections',
        'biometric_data_based_search_response', 'non_biometric_data_based_search_response',
        'avatar_based_search_response', 'mixed_data_based_search_response','video_analytics_configuration_response'
        // 'test'
    ],
    connectionConfig: {
        clientId: 'engage',
        brokers: kafkaHosts.split(','),
        ssl: {
            rejectUnauthorized: false,
            ca: [fs.readFileSync('./certificates/kafka-ca.crt', 'utf-8')],
            key: fs.readFileSync('./certificates/kafka-client-key.pem', 'utf-8'),
            cert: fs.readFileSync('./certificates/kafka-client-cert.pem', 'utf-8'),
        },
        sasl: {
            mechanism: 'plain', // Supported: 'plain', 'scram-sha-256', 'scram-sha-512'
            username: 'kafka',
            password: '7b08b167-2ff1-4b96-8040-a6998e9d31a3',
        }
    },
    // groupid: 'PREVAIL_CONSUMER_' + + (Math.floor(Math.random() * (1000) + 1)).toString()
    groupid: 'PREVAIL_CSIM_CONSUMER'
}

export const testConsumerConfig: KafkaConfigInterface = {
    topicNames: ['alert_person_search_request', 'avatar_based_search_request',
        'biometric_data_based_search_request', 'mixed_data_based_search_request', 'non_biometric_data_based_search_request'],
    connectionConfig: {
        clientId: 'engage',
        brokers: kafkaHosts.split(','),
        ssl: {
            rejectUnauthorized: false,
            ca: [fs.readFileSync('./certificates/kafka-ca.crt', 'utf-8')],
            key: fs.readFileSync('./certificates/kafka-client-key.pem', 'utf-8'),
            cert: fs.readFileSync('./certificates/kafka-client-cert.pem', 'utf-8'),
        },
        sasl: {
            mechanism: 'plain', // Supported: 'plain', 'scram-sha-256', 'scram-sha-512'
            username: 'kafka',
            password: '7b08b167-2ff1-4b96-8040-a6998e9d31a3',
        }
    },
    // groupid: 'PREVAIL_TEST_CONSUMER_' + (Math.floor(Math.random() * (1000) + 1)).toString()
    groupid: 'PREVAIL_TEST_CONSUMER'
}