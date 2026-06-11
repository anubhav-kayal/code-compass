import { Request, Response } from "express";
import { Repo, IndexJob } from "../../services/mongo";
import { queueIndexJob } from "../../jobs/indexRepoJob";
import { AppError } from "../middleware/errorHandler";

export async function indexRepo(req: Request, res: Response): Promise<void> {
  const { githubUrl, branch } = req.body;
  const result = await queueIndexJob(githubUrl, branch);
  res.status(202).json({
    success: true,
    data: result,
    message: "Repo indexing queued",
  });
}

export async function listRepos(_req: Request, res: Response): Promise<void> {
  const repos = await Repo.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: repos });
}

export async function getRepo(req: Request, res: Response): Promise<void> {
  const repo = await Repo.findById(req.params.id).lean();
  if (!repo) throw new AppError(404, "Repo not found");
  res.json({ success: true, data: repo });
}

export async function deleteRepo(req: Request, res: Response): Promise<void> {
  const repo = await Repo.findByIdAndDelete(req.params.id);
  if (!repo) throw new AppError(404, "Repo not found");
  res.json({ success: true, message: "Repo deleted" });
}

export async function reindexRepo(req: Request, res: Response): Promise<void> {
  const repo = await Repo.findById(req.params.id);
  if (!repo) throw new AppError(404, "Repo not found");
  const result = await queueIndexJob(repo.githubUrl, repo.defaultBranch);
  res.status(202).json({
    success: true,
    data: result,
    message: "Re-indexing queued",
  });
}

export async function getRepoStats(req: Request, res: Response): Promise<void> {
  const repo = await Repo.findById(req.params.id).lean();
  if (!repo) throw new AppError(404, "Repo not found");

  const job = await IndexJob.findOne({ repoId: req.params.id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: {
      repo,
      lastJob: job,
    },
  });
}
