import { useState, FormEvent } from "react";
import { GitBranch, Loader } from "lucide-react";
import { repoApi } from "../../services/api";

interface RepoInputProps {
  onRepoIndexed: (repoId: string) => void;
}

export function RepoInput({ onRepoIndexed }: RepoInputProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await repoApi.indexRepo(url.trim());
      const { repoId } = res.data.data;

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await repoApi.getRepo(repoId);
          const repo = statusRes.data.data;
          if (repo.status === "ready") {
            clearInterval(pollInterval);
            onRepoIndexed(repoId);
            setIsLoading(false);
          } else if (repo.status === "failed") {
            clearInterval(pollInterval);
            setError(repo.error || "Indexing failed");
            setIsLoading(false);
          }
        } catch {
          clearInterval(pollInterval);
          setIsLoading(false);
        }
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to index repo";
      setError(message);
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <GitBranch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full bg-gray-800 text-gray-100 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-700 placeholder-gray-500"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Indexing...
            </>
          ) : (
            "Index Repo"
          )}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
