import type { Repo } from "../../types";

interface RepoStatusProps {
  repo: Repo;
}

const statusConfig = {
  pending: { color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Pending" },
  indexing: { color: "text-blue-500", bg: "bg-blue-500/10", label: "Indexing" },
  ready: { color: "text-green-500", bg: "bg-green-500/10", label: "Ready" },
  failed: { color: "text-red-500", bg: "bg-red-500/10", label: "Failed" },
};

export function RepoStatus({ repo }: RepoStatusProps) {
  const config = statusConfig[repo.status];

  return (
    <div className="flex items-center gap-4">
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
        {config.label}
      </span>
      <span className="text-sm text-gray-400">{repo.totalFiles} files</span>
      <span className="text-sm text-gray-400">{repo.totalChunks} chunks</span>
      {repo.languages.length > 0 && (
        <span className="text-sm text-gray-500">{repo.languages.join(", ")}</span>
      )}
    </div>
  );
}
