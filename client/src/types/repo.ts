export interface Repo {
  _id: string;
  githubUrl: string;
  owner: string;
  name: string;
  defaultBranch: string;
  languages: string[];
  totalFiles: number;
  totalChunks: number;
  lastIndexedAt: string | null;
  status: "pending" | "indexing" | "ready" | "failed";
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IndexJobResult {
  jobId: string;
  repoId: string;
}
