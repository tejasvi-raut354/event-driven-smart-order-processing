# Event-Driven Smart Order Processing System

An event-driven microservices project built to demonstrate modern backend communication using TypeScript, GraphQL, Apache Kafka, gRPC, PostgreSQL, and Docker.

## Architecture

Client
   |
   v
GraphQL API
   |
   v
Order Service
   |
   +----> PostgreSQL
   |
   +----> Kafka ----> Notification Service
   |
   +----> gRPC ----> Payment Service
                         |
                         v
                     PostgreSQL

## Technologies

- TypeScript
- Node.js
- GraphQL
- Apache Kafka
- gRPC
- Protocol Buffers
- PostgreSQL
- Docker
- Docker Compose
- GitHub Actions

## Services

### 1. GraphQL API

Provides the client-facing API.

Port:

4000

Endpoint:

http://localhost:4000/graphql

### 2. Order Service

Responsible for creating and storing orders.

Port:

3001

### 3. Payment Service

Processes payments through gRPC communication.

Port:

50051

### 4. Notification Service

Consumes order-created events from Kafka.

### 5. PostgreSQL

Stores orders, payments and outbox events.

Port:

5432

### 6. Kafka

Handles asynchronous event communication.

Port:

9092

## Running the Project

Make sure Docker Desktop is running.

Then run:

```bash
docker compose up --build