# Event-Driven Smart Order Processing System

An **event-driven microservices-based order processing system** built to demonstrate modern backend architecture and communication using **TypeScript, Node.js, GraphQL, Apache Kafka, gRPC, Protocol Buffers, PostgreSQL, Docker, and Docker Compose**.

The project demonstrates both **synchronous and asynchronous communication** between independent services and explores concepts such as **microservices, event-driven architecture, database transactions, Kafka producers/consumers, gRPC, and containerization**.

---

## 🚀 Features

- Microservices-based architecture
- GraphQL API for client interaction
- REST-based communication between GraphQL API and Order Service
- Event-driven communication using Apache Kafka
- Kafka producer and consumer implementation
- PostgreSQL database integration
- Transactional order creation
- Outbox event storage
- gRPC Payment Service
- Protocol Buffers for service contracts
- Dockerized services
- Docker Compose orchestration
- Health-check endpoint for Order Service
- Separate database tables for orders, payments, and events

---

# 🏗️ Architecture

```text
                         CLIENT
                           |
                           v
                    +-------------+
                    | GraphQL API |
                    |   :4000     |
                    +-------------+
                           |
                           | HTTP
                           v
                    +-------------+
                    |Order Service|
                    |   :3001     |
                    +-------------+
                       /       \
                      /         \
                     v           v
             +-----------+   +----------------+
             | PostgreSQL|   | Apache Kafka   |
             |   :5432   |   |    :9092       |
             +-----------+   +----------------+
                  |                  |
                  |                  |
                  |                  v
                  |         +-------------------+
                  |         | Notification      |
                  |         | Service            |
                  |         +-------------------+
                  |
                  |
                  v
          +----------------+
          | Payment Service|
          |  gRPC :50051  |
          +----------------+
```

---

# 🔄 Order Processing Flow

When a client creates an order, the request follows this flow:

```text
Client
  |
  v
GraphQL API
  |
  v
Order Service
  |
  +----> PostgreSQL
  |        |
  |        +----> orders
  |        |
  |        +----> outbox_events
  |
  +----> Apache Kafka
            |
            v
    Notification Service
```

### Step-by-step

1. The client sends a `createOrder` mutation to the GraphQL API.
2. The GraphQL API forwards the request to the Order Service.
3. The Order Service validates the request.
4. A new order is inserted into PostgreSQL.
5. An `ORDER_CREATED` event is stored in the `outbox_events` table.
6. The database transaction is committed.
7. The Order Service publishes the order-created event to Apache Kafka.
8. The Notification Service consumes the event asynchronously.
9. The Notification Service processes the event and logs a notification message.

---

# 🧩 Microservices

The project consists of four application services and two infrastructure components.

## 1. GraphQL API

The GraphQL API acts as the client-facing entry point.

### Responsibilities

- Exposes GraphQL API
- Handles GraphQL queries and mutations
- Receives order creation requests
- Communicates with the Order Service

### Technology

- TypeScript
- Node.js
- Express
- Apollo Server
- GraphQL

### Port

```text
4000
```

### GraphQL Endpoint

```text
http://localhost:4000/graphql
```

---

## 2. Order Service

The Order Service is responsible for order creation and event publishing.

### Responsibilities

- Create orders
- Validate order input
- Store orders in PostgreSQL
- Create order events
- Store events in the outbox table
- Publish events to Kafka

### Technology

- TypeScript
- Node.js
- Express
- PostgreSQL
- KafkaJS

### Port

```text
3001
```

### Health Endpoint

```text
GET /health
```

Example response:

```json
{
  "service": "order-service",
  "status": "UP"
}
```

---

## 3. Payment Service

The Payment Service is a separate gRPC-based service.

### Responsibilities

- Expose a gRPC payment API
- Receive payment requests
- Generate transaction IDs
- Store payment records in PostgreSQL
- Return payment status

### Technology

- TypeScript
- Node.js
- gRPC
- Protocol Buffers
- PostgreSQL

### Port

```text
50051
```

### RPC Method

```text
ProcessPayment
```

### Important Note

The Payment Service is currently implemented as an independent gRPC service. The current Order Service does **not yet make an end-to-end gRPC call** to the Payment Service.

---

## 4. Notification Service

The Notification Service consumes order events from Kafka.

### Responsibilities

- Connect to Kafka
- Subscribe to the `order.created` topic
- Consume order-created events
- Process received events
- Log notification information

### Technology

- TypeScript
- Node.js
- KafkaJS
- Apache Kafka

### Kafka Topic

```text
order.created
```

### Consumer Group

```text
notification-group
```

Example output:

```text
Notification: Order 8adc6d89-4e08-4f8d-859c-0bd37c2b18c8 created for user U101
```

---

# 🗄️ PostgreSQL Database

PostgreSQL is used as the relational database for storing application data.

### Database

```text
ordersdb
```

### Port

```text
5432
```

The database contains three main tables.

---

## Orders Table

Stores order information.

```text
orders
├── id
├── user_id
├── product
├── amount
├── status
└── created_at
```

Example:

```text
id:       UUID
user_id:  U101
product:  Laptop
amount:   50000
status:   PENDING
```

---

## Payments Table

Stores payment information.

```text
payments
├── id
├── order_id
├── amount
├── status
└── created_at
```

---

## Outbox Events Table

Stores events associated with database operations.

```text
outbox_events
├── id
├── event_type
├── aggregate_id
├── payload
├── published
└── created_at
```

Example event:

```json
{
  "eventType": "ORDER_CREATED",
  "orderId": "8adc6d89-4e08-4f8d-859c-0bd37c2b18c8",
  "userId": "U101",
  "product": "Laptop",
  "amount": 50000
}
```

---

# 📡 Apache Kafka

Apache Kafka is used for asynchronous event-driven communication.

### Kafka Broker

```text
kafka:9092
```

### External Port

```text
9092
```

### Topic

```text
order.created
```

### Producer

The **Order Service** acts as the Kafka producer.

It publishes:

```text
ORDER_CREATED
```

events to the Kafka topic.

### Consumer

The **Notification Service** acts as the Kafka consumer.

It listens to:

```text
order.created
```

and processes incoming events asynchronously.

---

# 🔌 gRPC

The Payment Service uses **gRPC** for RPC-based communication.

The service contract is defined using **Protocol Buffers**.

Example:

```protobuf
service PaymentService {
    rpc ProcessPayment(PaymentRequest) returns (PaymentResponse);
}
```

Request:

```protobuf
message PaymentRequest {
    string order_id = 1;
    double amount = 2;
}
```

Response:

```protobuf
message PaymentResponse {
    string transaction_id = 1;
    string status = 2;
}
```

---

# 🔁 Outbox Pattern

The project demonstrates the database side of the **Outbox Pattern**.

When an order is created, the Order Service performs the following operations within a PostgreSQL transaction:

```text
BEGIN
   |
   +---- Insert Order
   |
   +---- Insert ORDER_CREATED event
   |
COMMIT
```

The event is then published to Kafka after the database transaction completes.

### Current Implementation Note

This project currently stores the event transactionally in the `outbox_events` table and then publishes it directly to Kafka.

A dedicated background outbox worker with retry handling is planned as a future improvement.

---

# 🐳 Docker

Each application service is containerized using Docker.

Services include:

```text
graphql-api
order-service
payment-service
notification-service
postgres
kafka
```

Docker provides an isolated and consistent environment for running the application.

---

# 🐳 Docker Compose

Docker Compose is used to run the complete application stack.

The Compose configuration manages:

- PostgreSQL
- Apache Kafka
- GraphQL API
- Order Service
- Payment Service
- Notification Service

All services communicate with each other through the Docker Compose network.

---

# 📁 Project Structure

```text
smart-order-processing-system/
│
├── .gitignore
├── README.md
├── docker-compose.yml
│
├── database/
│   └── init.sql
│
├── proto/
│   └── payment.proto
│
├── graphql-api/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   │
│   └── src/
│       ├── index.ts
│       ├── schema.ts
│       └── resolvers.ts
│
├── order-service/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   │
│   └── src/
│       ├── database.ts
│       ├── kafka-producer.ts
│       └── index.ts
│
├── payment-service/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── proto/
│   │   └── payment.proto
│   │
│   └── src/
│       ├── database.ts
│       └── server.ts
│
└── notification-service/
    ├── .dockerignore
    ├── Dockerfile
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    │
    └── src/
        └── consumer.ts
```

---

# 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| TypeScript | Application development |
| Node.js | Backend runtime |
| Express | HTTP server |
| GraphQL | Client-facing API |
| Apollo Server | GraphQL server |
| Apache Kafka | Event-driven communication |
| KafkaJS | Kafka integration |
| gRPC | RPC-based service communication |
| Protocol Buffers | gRPC service contract |
| PostgreSQL | Relational database |
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Git | Version control |
| GitHub | Source code hosting |

---

# ⚙️ Prerequisites

Before running the project, install:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

Make sure **Docker Desktop is running**.

No local Node.js, PostgreSQL, or Kafka installation is required when running the complete stack through Docker Compose.

---

# 🚀 Running the Project

Clone the repository:

```bash
git clone https://github.com/tejasvi-raut354/event-driven-smart-order-processing.git
```

Navigate into the project:

```powershell
cd event-driven-smart-order-processing
```

Build and start all services:

```powershell
docker compose up -d --build
```

Check running containers:

```powershell
docker compose ps
```

You should see containers for:

```text
order-postgres
order-kafka
order-service
payment-service
notification-service
graphql-api
```

---

# 🧪 Testing the Application

## 1. Test GraphQL Health

Open:

```text
http://localhost:4000/graphql
```

Run:

```graphql
query {
  health
}
```

Expected response:

```json
{
  "data": {
    "health": "GraphQL API is running"
  }
}
```

---

## 2. Create an Order

Run the following GraphQL mutation:

```graphql
mutation {
  createOrder(
    userId: "U102"
    product: "Keyboard"
    amount: 2500
  ) {
    id
    user_id
    product
    amount
    status
  }
}
```

Expected response:

```json
{
  "data": {
    "createOrder": {
      "id": "generated-uuid",
      "user_id": "U102",
      "product": "Keyboard",
      "amount": 2500,
      "status": "PENDING"
    }
  }
}
```

---

## 3. Verify Kafka Notification

Run:

```powershell
docker compose logs --tail=30 notification-service
```

Expected:

```text
Notification: Order <order-id> created for user U102
```

This confirms that:

```text
Order Service
      |
      v
Apache Kafka
      |
      v
Notification Service
```

is working correctly.

---

# 🔍 Useful Docker Commands

### View all services

```powershell
docker compose ps
```

### View all logs

```powershell
docker compose logs
```

### View Order Service logs

```powershell
docker compose logs order-service
```

### View Payment Service logs

```powershell
docker compose logs payment-service
```

### View Notification Service logs

```powershell
docker compose logs notification-service
```

### View GraphQL API logs

```powershell
docker compose logs graphql-api
```

### Follow logs in real time

```powershell
docker compose logs -f
```

### Stop services

```powershell
docker compose down
```

### Stop services and remove database volume

```powershell
docker compose down -v
```

> **Warning:** `docker compose down -v` removes the PostgreSQL volume and therefore deletes the stored database data.

---

# 📊 Example End-to-End Result

Example order:

```text
User ID: U101
Product: Laptop
Amount: 50000
```

The request travels through:

```text
GraphQL API
     |
     v
Order Service
     |
     +---------> PostgreSQL
     |              |
     |              +---- orders
     |              |
     |              +---- outbox_events
     |
     v
Apache Kafka
     |
     v
Notification Service
```

Example notification:

```text
Notification: Order 8adc6d89-4e08-4f8d-859c-0bd37c2b18c8 created for user U101
```

---

# 🎯 Key Concepts Demonstrated

## Microservices Architecture

The application is divided into multiple independently deployable services.

Each service has a specific responsibility.

```text
GraphQL API
Order Service
Payment Service
Notification Service
```

This makes the system easier to maintain and scale compared with a single monolithic application.

---

## Synchronous Communication

The GraphQL API communicates with the Order Service using HTTP.

```text
GraphQL API
     |
     | HTTP Request
     v
Order Service
```

The Payment Service also exposes a synchronous gRPC interface.

---

## Asynchronous Communication

The Order Service publishes events to Kafka.

The Notification Service consumes those events independently.

```text
Order Service
     |
     | Event
     v
   Kafka
     |
     | Event
     v
Notification Service
```

The producer and consumer do not need to communicate directly.

---

## Event-Driven Architecture

Instead of directly calling the Notification Service, the Order Service publishes an event:

```text
ORDER_CREATED
```

Other services can consume this event independently.

This approach helps reduce coupling between services.

---

## GraphQL

GraphQL allows clients to request exactly the fields they need.

Example:

```graphql
mutation {
  createOrder(
    userId: "U101"
    product: "Laptop"
    amount: 50000
  ) {
    id
    product
    amount
    status
  }
}
```

---

## Kafka Producer and Consumer

### Producer

The Order Service publishes messages to Kafka.

### Consumer

The Notification Service consumes messages from Kafka.

```text
Producer → Kafka Topic → Consumer
```

---

## gRPC and Protocol Buffers

The Payment Service uses gRPC with Protocol Buffers to define the service contract.

This provides a structured way to define RPC methods, requests, and responses.

---

## Database Transactions

Order creation and outbox event creation are performed inside the same PostgreSQL transaction.

```text
BEGIN

Insert Order

Insert Outbox Event

COMMIT
```

If an error occurs, the transaction is rolled back.

---

## Containerization

Docker packages each service with its required runtime environment.

This makes the application easier to run consistently across different machines.

---

# 🔐 Configuration

The services use environment variables for database and Kafka configuration.

Example:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
KAFKA_BROKER
```

Docker Compose supplies the required values to the containers.

---

# 📌 Current Project Status

### Implemented

- [x] GraphQL API
- [x] Order Service
- [x] PostgreSQL integration
- [x] Kafka producer
- [x] Kafka consumer
- [x] Notification Service
- [x] gRPC Payment Service
- [x] Protocol Buffers
- [x] Outbox event storage
- [x] PostgreSQL transactions
- [x] Dockerfiles
- [x] Docker Compose
- [x] Git/GitHub integration

### Planned Improvements

- [ ] Dedicated background Outbox Worker
- [ ] Outbox retry mechanism
- [ ] Kafka error handling
- [ ] Dead-letter topic
- [ ] End-to-end Order → Payment gRPC integration
- [ ] Payment status updates for orders
- [ ] Automated unit tests
- [ ] Integration tests
- [ ] GitHub Actions CI pipeline
- [ ] Authentication and authorization
- [ ] Centralized logging
- [ ] Monitoring and metrics

---

# 💡 Future Architecture

The planned architecture can be extended as follows:

```text
                         Client
                           |
                           v
                    +-------------+
                    | GraphQL API |
                    +-------------+
                           |
                           v
                    +-------------+
                    |Order Service|
                    +-------------+
                      |    |    |
                      |    |    |
                      |    |    +--------> Payment Service
                      |    |                  |
                      |    |                 gRPC
                      |    |                  |
                      |    |                  v
                      |    |              PostgreSQL
                      |    |
                      |    v
                      | Outbox Worker
                      |    |
                      |    v
                      |  Kafka
                      |    |
                      |    v
                      | Notification
                      | Service
                      |
                      v
                  PostgreSQL
```

---

# 📚 Learning Objectives

This project was developed to gain practical experience with:

- Microservices architecture
- Event-driven architecture
- Synchronous communication
- Asynchronous communication
- GraphQL API development
- Apache Kafka
- Kafka producers and consumers
- gRPC
- Protocol Buffers
- PostgreSQL
- Database transactions
- Outbox pattern concepts
- Docker
- Docker Compose
- Containerized application deployment
- Service-to-service communication
- Backend system design

---

# 👩‍💻 Author

**Tejasvi Raut**

B.Tech Information Technology  
Government College of Engineering Aurangabad

GitHub:  
https://github.com/tejasvi-raut354

Repository:  
https://github.com/tejasvi-raut354/event-driven-smart-order-processing

---

# ⭐ Project Purpose

This project was developed as a hands-on implementation to understand how modern backend systems can be designed using **microservices, event-driven communication, distributed messaging, RPC, relational databases, and containerization**.

The primary goal is to understand not only individual technologies, but also **how they work together as part of a distributed backend system**.