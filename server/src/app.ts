import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { connectMongo } from "./config/database";
import { connectNeo4j } from "./config/neo4j";
import { neo4jClient } from "./services/neo4j";
import { errorHandler } from "./api/middleware/errorHandler";
import { apiKeyAuth } from "./api/middleware/apiKeyAuth";
import { apiRoutes } from "./api/routes";
import { webhookRoutes } from "./api/routes/webhookRoutes";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.security.allowedOrigins }));
app.use(morgan("dev"));
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: string }).rawBody = buf.toString("utf-8");
    },
  })
);

// Webhooks authenticate via GitHub's HMAC signature, not our own API key,
// so they're mounted outside the apiKeyAuth gate.
app.use("/webhooks", webhookRoutes);
app.use("/api", apiKeyAuth, apiRoutes);

app.use(errorHandler);

async function start(): Promise<void> {
  await connectMongo();
  await connectNeo4j();
  await neo4jClient.createConstraints();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

start().catch(console.error);

export default app;
