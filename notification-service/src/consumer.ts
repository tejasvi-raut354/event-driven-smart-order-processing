import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const kafka = new Kafka({
    clientId: "notification-service",
    brokers: [
        process.env.KAFKA_BROKER || "localhost:9092"
    ]
});

const consumer = kafka.consumer({
    groupId: "notification-group"
});

async function start() {

    await consumer.connect();

    await consumer.subscribe({
        topic: "order.created",
        fromBeginning: true
    });

    console.log(
        "Notification Service connected to Kafka"
    );

    await consumer.run({

        eachMessage: async ({ message }) => {

            const value =
                message.value?.toString();

            if (!value) return;

            const event = JSON.parse(value);

            console.log(
                `Notification: Order ${event.orderId} created for user ${event.userId}`
            );
        }
    });
}

start().catch(console.error);