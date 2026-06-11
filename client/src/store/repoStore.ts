import { create } from "zustand";
import type { Repo } from "../types";

interface RepoState {
  repos: Repo[];
  activeRepoId: string | null;
  activeRepo: Repo | null;
  setRepos: (repos: Repo[]) => void;
  setActiveRepoId: (id: string | null) => void;
  setActiveRepo: (repo: Repo | null) => void;
  addRepo: (repo: Repo) => void;
  removeRepo: (id: string) => void;
}

export const useRepoStore = create<RepoState>((set) => ({
  repos: [],
  activeRepoId: null,
  activeRepo: null,
  setRepos: (repos) => set({ repos }),
  setActiveRepoId: (id) => set({ activeRepoId: id }),
  setActiveRepo: (repo) => set({ activeRepo: repo }),
  addRepo: (repo) => set((state) => ({ repos: [...state.repos, repo] })),
  removeRepo: (id) =>
    set((state) => ({
      repos: state.repos.filter((r) => r._id !== id),
      activeRepoId: state.activeRepoId === id ? null : state.activeRepoId,
    })),
}));
