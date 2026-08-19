import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const repoApi = {
  indexRepo: (githubUrl: string, branch?: string) =>
    api.post("/repos", { githubUrl, branch }),

  listRepos: () => api.get("/repos"),

  getRepo: (id: string) => api.get(`/repos/${id}`),

  deleteRepo: (id: string) => api.delete(`/repos/${id}`),

  reindexRepo: (id: string) => api.post(`/repos/${id}/reindex`),

  getRepoStats: (id: string) => api.get(`/repos/${id}/stats`),
};

export const chatApi = {
  sendMessage: (repoId: string, message: string, conversationId?: string) =>
    api.post("/chat", { repoId, message, conversationId }),

  listConversations: () => api.get("/chat/conversations"),

  getConversation: (id: string) => api.get(`/chat/conversations/${id}`),

  deleteConversation: (id: string) => api.delete(`/chat/conversations/${id}`),
};

export const searchApi = {
  search: (params: { q: string; repoId: string; type?: string; page?: number; limit?: number }) =>
    api.get("/search", { params }),

  searchSymbols: (query: string, repoId: string) =>
    api.get("/search/symbols", { params: { query, repoId } }),
};

export const graphApi = {
  getCallers: (functionName: string, repoId: string) =>
    api.get("/graph/callers", { params: { function: functionName, repoId } }),

  getCallees: (functionName: string, repoId: string) =>
    api.get("/graph/callees", { params: { function: functionName, repoId } }),

  getDependencies: (path: string, repoId: string) =>
    api.get("/graph/dependencies", { params: { path, repoId } }),

  getArchitecture: (repoId: string) =>
    api.get("/graph/architecture", { params: { repoId } }),

  getRepoGraph: (repoId: string) =>
    api.get("/graph/repo", { params: { repoId } }),

  getImpact: (functionName: string, repoId: string, depth?: number) =>
    api.get("/graph/impact", { params: { function: functionName, repoId, depth } }),
};
