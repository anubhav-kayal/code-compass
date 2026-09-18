import { indexQueue } from "./queue";
import { runIngestionPipeline } from "../pipelines/ingestion/pipeline";
import { Repo } from "../services/mongo";
import { logger } from "../utils/logger";
import { parseGithubUrl } from "../utils/githubUrl";
import { AppError } from "../api/middleware/errorHandler";

export interface IndexJobData {
  githubUrl: string;
  repoId: string;
  branch?: string;
}

indexQueue.process(async (job) => {
  const data = job.data as IndexJobData;
  logger.info("Processing index job", { jobId: job.id, url: data.githubUrl });

  await Repo.findByIdAndUpdate(data.repoId, { status: "indexing" });

  try {
    const result = await runIngestionPipeline(data.githubUrl, data.branch);
    logger.info("Index job completed", { jobId: job.id, repoId: result.repoId });
    return result;
  } catch (error) {
    await Repo.findByIdAndUpdate(data.repoId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
});

export async function queueIndexJob(
  githubUrl: string,
  branch?: string
): Promise<{ jobId: string; repoId: string }> {
  const ref = parseGithubUrl(githubUrl);
  if (!ref) throw new AppError(400, "Invalid GitHub URL");

  const repo = await Repo.findOneAndUpdate(
    { githubUrl },
    {
      githubUrl,
      owner: ref.owner,
      name: ref.name,
      defaultBranch: branch || "main",
      status: "pending",
    },
    { new: true, upsert: true }
  );

  if (repo.status === "indexing" || repo.status === "pending") {
    const existingJobs = await indexQueue.getJobs(["active", "waiting", "delayed"]);
    const inFlight = existingJobs.find((j) => (j.data as IndexJobData).repoId === repo._id.toString());
    if (inFlight) {
      return { jobId: inFlight.id.toString(), repoId: repo._id.toString() };
    }
  }

  await Repo.findByIdAndUpdate(repo._id, { status: "pending" });

  const job = await indexQueue.add(
    { githubUrl, repoId: repo._id.toString(), branch },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
  );

  return { jobId: job.id.toString(), repoId: repo._id.toString() };
}
