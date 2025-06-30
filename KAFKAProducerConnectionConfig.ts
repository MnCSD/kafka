import * as fs from 'fs'
import { KafkaConfig } from 'kafkajs'
import { kafkaHosts } from '../../CONFIG'


export const ProducerConfig: { connectionConfig: KafkaConfig, groupid: string } = {
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
            mechanism: "plain", // Supported: 'plain', 'scram-sha-256', 'scram-sha-512'
            username: 'kafka',
            password: '7b08b167-2ff1-4b96-8040-a6998e9d31a3',
        }
    },
    groupid: 'PREVAIL_PRODUCER'
}