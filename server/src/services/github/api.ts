import { config } from "../../config";
import { parseGithubUrl } from "../../utils/githubUrl";

export interface GitHubRepoInfo {
  owner: string;
  name: string;
  defaultBranch: string;
  languages: string[];
  description: string;
}

interface GitHubRepoApiResponse {
  default_branch?: string;
  description?: string | null;
}

export async function getRepoInfo(githubUrl: string): Promise<GitHubRepoInfo> {
  const ref = parseGithubUrl(githubUrl);
  if (!ref) {
    throw new Error("Invalid GitHub URL");
  }

  const owner = ref.owner;
  const name = ref.name;

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

  const repoData = (await repoRes.json()) as GitHubRepoApiResponse;
  const langsData = (await langsRes.json()) as Record<string, number>;

  return {
    owner,
    name,
    defaultBranch: repoData.default_branch || "main",
    languages: Object.keys(langsData),
    description: repoData.description || "",
  };
}
