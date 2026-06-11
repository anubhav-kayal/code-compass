import { useEffect, useState } from "react";
import { repoApi } from "../../services/api";
import type { Repo } from "../../types";

interface HeaderProps {
  activeRepoId: string | null;
  onRepoChange: (id: string | null) => void;
}

export function Header({ activeRepoId, onRepoChange }: HeaderProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [currentRepo, setCurrentRepo] = useState<Repo | null>(null);

  useEffect(() => {
    repoApi.listRepos().then((res) => setRepos(res.data.data || []));
  }, []);

  useEffect(() => {
    if (activeRepoId) {
      repoApi.getRepo(activeRepoId).then((res) => setCurrentRepo(res.data.data));
    } else {
      setCurrentRepo(null);
    }
  }, [activeRepoId]);

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4">
      <select
        value={activeRepoId || ""}
        onChange={(e) => onRepoChange(e.target.value || null)}
        className="bg-gray-800 text-gray-100 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 max-w-xs"
      >
        <option value="">Select a repository...</option>
        {repos.map((repo) => (
          <option key={repo._id} value={repo._id}>
            {repo.owner}/{repo.name}
          </option>
        ))}
      </select>

      {currentRepo && (
        <div className="flex items-center gap-3 text-sm text-gray-400 ml-auto">
          <span className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                currentRepo.status === "ready"
                  ? "bg-green-500"
                  : currentRepo.status === "indexing"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            {currentRepo.status}
          </span>
          <span>{currentRepo.totalChunks} chunks</span>
          <span>{currentRepo.totalFiles} files</span>
        </div>
      )}
    </header>
  );
}
