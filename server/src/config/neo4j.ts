import neo4j from "neo4j-driver";
import { config } from "./index";

export const neo4jDriver = neo4j.driver(
  config.neo4j.uri,
  neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
);

export async function connectNeo4j(): Promise<void> {
  try {
    await neo4jDriver.verifyConnectivity();
    console.log("Connected to Neo4j");
  } catch (error) {
    console.error("Neo4j connection error:", error);
    process.exit(1);
  }
}
