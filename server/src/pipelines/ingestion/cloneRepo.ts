import simpleGit from "simple-git";
import path from "path";
import { ensureDir, removeDir } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";

const TEMP_DIR = path.resolve(__dirname, "../../../temp");

export interface CloneResult {
  repoPath: string;
  branch: string;
  commitHash: string;
}

export async function cloneRepo(
  githubUrl: string,
  branch?: string
): Promise<CloneResult> {
  const repoDir = path.join(TEMP_DIR, `repo-${Date.now()}`);
  await ensureDir(repoDir);

  const git = simpleGit();
  logger.info("Cloning repository", { url: githubUrl, branch });

  await git.clone(githubUrl, repoDir, [
    "--depth",
    "1",
    ...(branch ? ["--branch", branch] : []),
  ]);

  const localGit = simpleGit(repoDir);
  const logResult = await localGit.log({ maxCount: 1 });
  const currentBranch = (await localGit.branch()).current;

  return {
    repoPath: repoDir,
    branch: currentBranch,
    commitHash: logResult.latest?.hash || "",
  };
}

export async function cleanupClone(repoPath: string): Promise<void> {
  await removeDir(repoPath);
  logger.info("Cleaned up cloned repo", { path: repoPath });
}
