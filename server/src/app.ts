import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { connectMongo } from "./config/database";
import { connectNeo4j } from "./config/neo4j";
import { errorHandler } from "./api/middleware/errorHandler";
import { apiRoutes } from "./api/routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

app.use("/api", apiRoutes);

app.use(errorHandler);

async function start(): Promise<void> {
  await connectMongo();
  await connectNeo4j();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

start().catch(console.error);

export default app;
