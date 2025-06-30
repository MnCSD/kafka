import KafkaAdminService from "../KAFKAadminService";
import { CONNECTION_CONFIG } from "./config";


(async () => {
    console.log('Test Kafka admin');

    const kafkaAdminService = new KafkaAdminService(CONNECTION_CONFIG as any);

    console.log('Getting admin');
    //@ts-ignore
    const admin = await kafkaAdminService.getAdmin();
    console.log('Admin connected');

    console.log('Getting list of topics');
    const topics = await admin.listTopics();
    console.log('Received topics', topics?.length ?? 'No topics')

    console.log('All OK. Exiting');
    process.exit();
})();
