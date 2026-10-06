export const resolvers = {

    Query: {

        health: () => {
            return "GraphQL API is running";
        }
    },

    Mutation: {

        createOrder: async (
            _: any,
            args: {
                userId: string;
                product: string;
                amount: number;
            }
        ) => {

            const response =
                await fetch(
                    "http://order-service:3001/orders",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            userId: args.userId,
                            product: args.product,
                            amount: args.amount
                        })
                    }
                );

            return response.json();
        }
    }
};