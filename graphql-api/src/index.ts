import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware }
    from "@apollo/server/express4";
import cors from "cors";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";

async function start() {

    const app = express();

    const server = new ApolloServer({
        typeDefs,
        resolvers
    });

    await server.start();

    app.use(
        "/graphql",
        cors<cors.CorsRequest>(),
        express.json(),
        expressMiddleware(server)
    );

    app.listen(4000, () => {

        console.log(
            "GraphQL API running on http://localhost:4000/graphql"
        );
    });
}

start();