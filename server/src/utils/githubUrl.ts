export interface GitHubRepoRef {
  owner: string;
  name: string;
  /** Normalized https clone URL, safe to pass to `git clone`. */
  cloneUrl: string;
}

const OWNER_OR_REPO = /^[A-Za-z0-9._-]+$/;

/**
 * Strictly validates and parses a GitHub repo reference. Only accepts
 * `https://github.com/<owner>/<repo>[.git]` (with an optional trailing
 * slash) or the `git@github.com:<owner>/<repo>.git` SSH form — the host
 * must be exactly `github.com`, not merely contain it, to prevent SSRF
 * via URLs like `https://internal.local/x/github.com/owner/repo`.
 */
export function parseGithubUrl(input: string): GitHubRepoRef | null {
  const trimmed = input.trim();

  const sshMatch = trimmed.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (sshMatch) {
    return toRef(sshMatch[1], sshMatch[2]);
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  return toRef(parts[0], parts[1].replace(/\.git$/, ""));
}

function toRef(owner: string, name: string): GitHubRepoRef | null {
  if (!OWNER_OR_REPO.test(owner) || !OWNER_OR_REPO.test(name)) return null;
  return { owner, name, cloneUrl: `https://github.com/${owner}/${name}.git` };
}
