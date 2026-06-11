import Bull from "bull";
import { config } from "../config";

export const indexQueue = new Bull("repo-indexing", config.redis.url);

indexQueue.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

indexQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});
