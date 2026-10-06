import express from "express";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { pool } from "./database";
import {
    connectKafkaProducer,
    publishOrderCreated
} from "./kafka-producer";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({
        service: "order-service",
        status: "UP"
    });
});

app.post("/orders", async (req, res) => {
    const { userId, product, amount } = req.body;

    if (!userId || !product || !amount) {
        return res.status(400).json({
            error: "userId, product and amount are required"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const orderId = randomUUID();

        const orderResult = await client.query(
            `INSERT INTO orders
            (id, user_id, product, amount, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                orderId,
                userId,
                product,
                amount,
                "PENDING"
            ]
        );

        const event = {
            eventType: "ORDER_CREATED",
            orderId,
            userId,
            product,
            amount
        };

        await client.query(
            `INSERT INTO outbox_events
            (id, event_type, aggregate_id, payload)
            VALUES ($1, $2, $3, $4)`,
            [
                randomUUID(),
                "ORDER_CREATED",
                orderId,
                event
            ]
        );

        await client.query("COMMIT");

        await publishOrderCreated(event);

        res.status(201).json(orderResult.rows[0]);

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({
            error: "Failed to create order"
        });

    } finally {
        client.release();
    }
});

app.listen(3001, async () => {

    console.log("Order Service running on port 3001");

    await connectKafkaProducer();
});