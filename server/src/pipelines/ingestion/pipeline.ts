import { cloneRepo, cleanupClone, CloneResult } from "./cloneRepo";
import { detectLanguagesInRepo, FileEntry } from "./detectLanguages";
import { parseFiles } from "../ast-parser/parser";
import { chunkCode } from "../chunker/chunkCode";
import { embedChunks } from "../embedder/embedChunks";
import { buildGraph } from "../graph-builder/buildCallGraph";
import { Repo, Chunk, IndexJob } from "../../services/mongo";
import { neo4jClient } from "../../services/neo4j";
import { logger } from "../../utils/logger";

export interface PipelineResult {
  repoId: string;
  totalFiles: number;
  totalChunks: number;
  languages: string[];
}

export async function runIngestionPipeline(
  githubUrl: string,
  branch?: string
): Promise<PipelineResult> {
  let cloneResult: CloneResult | null = null;
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) throw new Error("Invalid GitHub URL");

  const owner = match[1];
  const name = match[2].replace(".git", "");

  const repo = await Repo.findOneAndUpdate(
    { githubUrl },
    {
      githubUrl,
      owner,
      name,
      defaultBranch: branch || "main",
      status: "indexing",
    },
    { new: true, upsert: true }
  );

  const job = await IndexJob.create({
    repoId: repo._id,
    status: "running",
    progress: 0,
    stages: { clone: "running", parse: "pending", chunk: "pending", embed: "pending", graph: "pending" },
  });

  try {
    cloneResult = await cloneRepo(githubUrl, branch);
    await IndexJob.findByIdAndUpdate(job._id, {
      $set: { "stages.clone": "completed", progress: 20 },
    });

    const { files, languages } = await detectLanguagesInRepo(cloneResult.repoPath);
    await Repo.findByIdAndUpdate(repo._id, { languages });
    await IndexJob.findByIdAndUpdate(job._id, {
      $set: { "stages.parse": "running", progress: 30 },
    });

    const parsedFiles = await parseFiles(files);
    await IndexJob.findByIdAndUpdate(job._id, {
      $set: { "stages.parse": "completed", "stages.chunk": "running", progress: 50 },
    });

    const chunks = chunkCode(parsedFiles, repo._id.toString());
    const chunkedWithEmbeddings = await embedChunks(chunks);
    await Chunk.insertMany(chunkedWithEmbeddings);
    await Repo.findByIdAndUpdate(repo._id, { totalChunks: chunkedWithEmbeddings.length });
    await IndexJob.findByIdAndUpdate(job._id, {
      $set: { "stages.chunk": "completed", "stages.embed": "completed", "stages.graph": "running", progress: 85 },
    });

    await neo4jClient.clearRepo(repo._id.toString());
    await buildGraph(parsedFiles, repo._id.toString());
    await IndexJob.findByIdAndUpdate(job._id, {
      $set: { "stages.graph": "completed", progress: 100 },
    });

    await Repo.findByIdAndUpdate(repo._id, {
      status: "ready",
      totalFiles: files.length,
      lastIndexedAt: new Date(),
      error: null,
    });
    await IndexJob.findByIdAndUpdate(job._id, {
      status: "completed",
      completedAt: new Date(),
    });

    logger.info("Pipeline completed", { repoId: repo._id.toString() });

    return {
      repoId: repo._id.toString(),
      totalFiles: files.length,
      totalChunks: chunks.length,
      languages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await Repo.findByIdAndUpdate(repo._id, { status: "failed", error: message });
    await IndexJob.findByIdAndUpdate(job._id, {
      status: "failed",
      error: message,
      completedAt: new Date(),
    });
    logger.error("Pipeline failed", { error: message });
    throw error;
  } finally {
    if (cloneResult) {
      await cleanupClone(cloneResult.repoPath);
    }
  }
}
