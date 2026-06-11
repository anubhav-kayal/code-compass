import { config } from "../../config";

export interface GitHubRepoInfo {
  owner: string;
  name: string;
  defaultBranch: string;
  languages: string[];
  description: string;
}

export async function getRepoInfo(githubUrl: string): Promise<GitHubRepoInfo> {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error("Invalid GitHub URL");
  }

  const owner = match[1];
  const name = match[2].replace(".git", "");

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (config.github.token) {
    headers.Authorization = `Bearer ${config.github.token}`;
  }

  const [repoRes, langsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${name}`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${name}/languages`, { headers }),
  ]);

  if (!repoRes.ok) {
    throw new Error(`GitHub API error: ${repoRes.statusText}`);
  }

  const repoData = await repoRes.json();
  const langsData = await langsRes.json();

  return {
    owner,
    name,
    defaultBranch: repoData.default_branch || "main",
    languages: Object.keys(langsData),
    description: repoData.description || "",
  };
}
