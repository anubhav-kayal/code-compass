import Bull from "bull";
import { config } from "../config";
import { logger } from "../utils/logger";

export const indexQueue = new Bull("repo-indexing", config.redis.url, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

indexQueue.on("completed", (job) => {
  logger.info("Index job completed", { jobId: job.id });
});

indexQueue.on("failed", (job, err) => {
  logger.error("Index job failed", { jobId: job?.id, error: err.message });
});
