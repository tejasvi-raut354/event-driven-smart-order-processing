import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import dotenv from "dotenv";
import { pool } from "./database";
import { randomUUID } from "crypto";

dotenv.config();

const PROTO_PATH = __dirname + "/../proto/payment.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

console.log(
    "Proto definition keys:",
    Object.keys(packageDefinition)
);

const paymentProto = grpc.loadPackageDefinition(
    packageDefinition
) as any;

console.log(
    "Loaded proto keys:",
    Object.keys(paymentProto)
);
async function processPayment(
    call: any,
    callback: any
) {
    const { order_id, amount } = call.request;

    const transactionId = randomUUID();

    try {
        await pool.query(
            `INSERT INTO payments
            (id, order_id, amount, status)
            VALUES ($1, $2, $3, $4)`,
            [
                transactionId,
                order_id,
                amount,
                "SUCCESS"
            ]
        );

        console.log(
            `Payment processed for order ${order_id}`
        );

        callback(null, {
            transaction_id: transactionId,
            status: "SUCCESS"
        });

    } catch (error) {
        console.error(error);

        callback({
            code: grpc.status.INTERNAL,
            message: "Payment processing failed"
        });
    }
}

const server = new grpc.Server();

server.addService(
    paymentProto.payment.PaymentService.service,
    {
        ProcessPayment: processPayment
    }
);

server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
        if (error) {
            console.error("Failed to start Payment Service:", error);
            return;
        }

        console.log(
            `Payment Service running on port ${port}`
        );
    }
);