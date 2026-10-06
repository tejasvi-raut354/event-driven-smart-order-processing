import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "order-service",
    brokers: [process.env.KAFKA_BROKER || "localhost:9092"]
});

export const producer = kafka.producer();

export async function connectKafkaProducer() {
    await producer.connect();
    console.log("Kafka producer connected");
}

export async function publishOrderCreated(event: any) {
    await producer.send({
        topic: "order.created",
        messages: [
            {
                key: event.orderId,
                value: JSON.stringify(event)
            }
        ]
    });

    console.log("Order event published to Kafka");
}