export interface RepoDocument {
  _id?: string;
  githubUrl: string;
  owner: string;
  name: string;
  defaultBranch: string;
  languages: string[];
  totalFiles: number;
  totalChunks: number;
  lastIndexedAt: Date | null;
  status: "pending" | "indexing" | "ready" | "failed";
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IndexJobDocument {
  _id?: string;
  repoId: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  stages: {
    clone: string;
    parse: string;
    chunk: string;
    embed: string;
    graph: string;
  };
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
}
