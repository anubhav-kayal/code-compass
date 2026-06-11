import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/code-compass",
  },
  neo4j: {
    uri: process.env.NEO4J_URI || "bolt://localhost:7687",
    user: process.env.NEO4J_USER || "neo4j",
    password: process.env.NEO4J_PASSWORD || "password",
  },
  llm: {
    apiKey: process.env.LLM_API_KEY || "",
    model: process.env.LLM_MODEL || "llama3.2",
    endpoint: process.env.LLM_ENDPOINT || "http://localhost:11434/v1",
  },
  embedding: {
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text",
    dimension: parseInt(process.env.EMBEDDING_DIMENSION || "768", 10),
  },
  github: {
    token: process.env.GITHUB_TOKEN || "",
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
};
