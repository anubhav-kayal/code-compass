export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChatRequest {
  repoId: string;
  conversationId?: string;
  message: string;
}

export interface ChatResponse {
  message: string;
  sources: SourceCitation[];
  graphContext?: unknown;
}

export interface SourceCitation {
  chunkId: string;
  filePath: string;
  startLine: number;
  endLine: number;
  relevance: number;
  snippet: string;
}

export interface IndexRepoRequest {
  githubUrl: string;
  branch?: string;
}

export interface SearchRequest {
  q: string;
  repoId: string;
  type?: "code" | "symbol" | "file";
  page?: number;
  limit?: number;
}
