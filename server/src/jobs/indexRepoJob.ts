import { indexQueue } from "./queue";
import { runIngestionPipeline } from "../pipelines/ingestion/pipeline";
import { Repo } from "../services/mongo";
import { logger } from "../utils/logger";

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
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) throw new Error("Invalid GitHub URL");

  const repo = await Repo.create({
    githubUrl,
    owner: match[1],
    name: match[2].replace(".git", ""),
    defaultBranch: branch || "main",
    status: "pending",
  });

  const job = await indexQueue.add({
    githubUrl,
    repoId: repo._id.toString(),
    branch,
  });

  return { jobId: job.id.toString(), repoId: repo._id.toString() };
}
