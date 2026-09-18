import { Request, Response } from "express";
import { Repo } from "../../services/mongo";
import { queueIndexJob } from "../../jobs/indexRepoJob";
import { verifyWebhookSignature, parseWebhookEvent } from "../../services/github/webhook";
import { logger } from "../../utils/logger";

export async function handleGithubWebhook(req: Request, res: Response): Promise<void> {
  const rawBody = (req as Request & { rawBody?: string }).rawBody || "";

  if (!verifyWebhookSignature(req, rawBody)) {
    res.status(401).json({ success: false, error: "Invalid webhook signature" });
    return;
  }

  const { event, repoFullName, ref } = parseWebhookEvent(req);

  if (event !== "push" || !repoFullName) {
    res.json({ success: true, message: "Ignored" });
    return;
  }

  const repo = await Repo.findOne({ githubUrl: new RegExp(`${repoFullName}(\\.git)?/?$`, "i") });
  if (!repo) {
    res.json({ success: true, message: "Repo not indexed, ignoring" });
    return;
  }

  const branch = ref?.replace("refs/heads/", "");
  if (branch && repo.defaultBranch && branch !== repo.defaultBranch) {
    res.json({ success: true, message: "Push to non-default branch, ignoring" });
    return;
  }

  logger.info("Webhook triggered re-index", { repoFullName, branch });
  const result = await queueIndexJob(repo.githubUrl, repo.defaultBranch);
  res.json({ success: true, message: "Re-indexing queued", data: result });
}
