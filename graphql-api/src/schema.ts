export const typeDefs = `#graphql

    type Order {
        id: ID!
        user_id: String!
        product: String!
        amount: Float!
        status: String!
        created_at: String
    }

    type Query {
        health: String
    }

    type Mutation {
        createOrder(
            userId: String!
            product: String!
            amount: Float!
        ): Order
    }
`;