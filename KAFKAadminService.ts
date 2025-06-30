import { Kafka, KafkaConfig, ConfigResourceTypes, Admin } from 'kafkajs'
import { AdminConfig } from './KAFKAadminConnectionConfig'

export interface KafkaConfigInterface {
    topicName: string
    connectionConfig: KafkaConfig, // may be we will use SSL configuration
    groupid: string
}

export default class KafkaAdminService {
    private _kafkaConfig: KafkaConfig;
    private _admin: Promise<Admin>

    constructor(kafkaConfig: { connectionConfig: KafkaConfig, groupid: string }) {
        this._kafkaConfig = kafkaConfig.connectionConfig
    }

    private getAdmin(): Promise<Admin> {
        return new Promise<Admin>((resolve, reject) => {
            const kafka = new Kafka(this._kafkaConfig);
            const admin = kafka.admin();

            admin.connect().catch((err) => {
                console.error("KAFKA ADMIN CONNECTION ERROR ", err);
                reject(err);
            });

            admin.on('admin.connect', () => {
                console.log("KAFKA ADMIN CONNECTED");
                resolve(admin);
            });

            admin.on('admin.disconnect', (err) => {
                console.log("KAFKA ADMIN DISCONNECTED");
                reject(err);
            });

        });

    }

    public async alterConfigs(entries: Array<{ name: string, value: string }>) {
        try {
            const admin = await this.getAdmin();

            const topics = await admin.listTopics()

            const resources = topics.map((topic) => {
                return {
                    type: ConfigResourceTypes.TOPIC,
                    name: topic,
                    configEntries: entries,
                }
            })

            await admin.alterConfigs({
                validateOnly: false,
                resources: resources,
            })

            return true;
        }
        catch (e) {
            console.error("Error when altering Kafka topic Retention ", e);
            return false;
        }
    }

    public async createCameraDataTopics(cameraID: string) {
        try {
            const cameraIDAssociationTopicName = cameraID + '_associations'
            const cameraIDDetectionTopicName = cameraID + '_detections'

            let newTopicsList = {
                topics: [] as any[],
                waitForLeaders: true
            }

            const newTopic = {
                topic: '',
                numPartitions: 1,
                replicationFactor: 1,
                configEntries: [
                    { name: "segment.bytes", value: "1073741824" },
                    { name: "retention.ms", value: "1080000" },
                    { name: "max.message.bytes", value: "521048588" },
                    { name: "delete.retention.ms", value: "86400000" },
                    { name: "segment.ms", value: "1080000" },
                    { name: "segment.index.bytes", value: "10485760" },
                ]
            }

            const admin = await this.getAdmin();
            const topics = await admin.listTopics();


            if (!topics.includes(cameraIDAssociationTopicName)) {
                const newAssociationsTopic = {
                    ...newTopic,
                    topic: cameraIDAssociationTopicName
                }
                newTopicsList.topics.push(newAssociationsTopic)
            }

            if (!topics.includes(cameraIDDetectionTopicName)) {
                const newDetectionsTopic = {
                    ...newTopic,
                    topic: cameraIDDetectionTopicName
                }
                newTopicsList.topics.push(newDetectionsTopic)
            }

            if (newTopicsList.topics.length > 0) {
                console.log("Kafka Camera Consumer creating new Camera Info Topics for camera:", cameraID)
                await admin.createTopics(newTopicsList);
            }
        }
        catch (e) {
            console.error("Error in kafka Admin when creating Kafka topics ", e);

            return e;
        }
    }
}

export const kafkaAdminInstance = new KafkaAdminService(AdminConfig);