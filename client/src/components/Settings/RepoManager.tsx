import { useEffect, useState } from "react";
import { RefreshCw, Trash2, CheckCircle2, Loader, FolderGit2, FileCode2, Braces } from "lucide-react";
import { repoApi } from "../../services/api";
import type { Repo } from "../../types";
import { shortPath } from "../../utils/formatting";

interface RepoManagerProps {
  activeRepoId: string;
  onSelectRepo: (id: string) => void;
  onRepoChange: () => void;
}

const STATUS_STYLES: Record<Repo["status"], { label: string; cls: string }> = {
  ready: { label: "Ready", cls: "bg-go/10 text-go" },
  indexing: { label: "Indexing", cls: "bg-signal-500/10 text-signal-400" },
  pending: { label: "Queued", cls: "bg-brass-300/10 text-brass-300" },
  failed: { label: "Failed", cls: "bg-stop/10 text-stop" },
};

export function RepoManager({ activeRepoId, onSelectRepo, onRepoChange }: RepoManagerProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await repoApi.listRepos();
      setRepos(res.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function reindex(repo: Repo) {
    setBusy(repo._id);
    try {
      await repoApi.reindexRepo(repo._id);
      onRepoChange();
      pollUntilDone(repo._id);
    } finally {
      setBusy(null);
    }
  }

  async function remove(repo: Repo) {
    if (!confirm(`Delete ${repo.owner}/${repo.name} and its index?`)) return;
    setBusy(repo._id);
    try {
      await repoApi.deleteRepo(repo._id);
      onRepoChange();
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  function pollUntilDone(id: string) {
    const t = setInterval(async () => {
      try {
        const repo = (await repoApi.getRepo(id)).data.data as Repo;
        if (repo.status === "ready" || repo.status === "failed") {
          clearInterval(t);
          onRepoChange();
          await refresh();
        }
      } catch {
        clearInterval(t);
      }
    }, 2000);
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-up px-2 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cloud">Repositories</h1>
          <p className="mt-1 text-sm text-mist">Manage indexed codebases and their indices.</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-mist transition-colors hover:text-cloud"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-mist">
          <Loader size={18} className="animate-spin text-signal-400" />
          Loading repositories…
        </div>
      )}

      {!loading && repos.length === 0 && (
        <div className="rounded-xl2 border border-dashed border-line p-12 text-center text-sm text-mist">
          No repositories indexed yet. Head to the landing page to add one.
        </div>
      )}

      <div className="space-y-3">
        {repos.map((repo) => {
          const st = STATUS_STYLES[repo.status] || STATUS_STYLES.failed;
          const isActive = repo._id === activeRepoId;
          return (
            <div
              key={repo._id}
              className={`rounded-xl2 border p-4 transition-all ${
                isActive ? "border-signal-500/50 bg-panel/80 shadow-glow-soft" : "border-line bg-panel/50 hover:border-signal-500/30"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-abyss">
                  <FolderGit2 size={18} className="text-signal-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => onSelectRepo(repo._id)}
                    className="truncate text-left font-display font-semibold text-cloud hover:text-signal-300"
                  >
                    {repo.owner}/{repo.name}
                  </button>
                  <p className="truncate font-mono text-xs text-fade">{shortPath(repo.githubUrl)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.cls}`}>
                  {repo.status === "indexing" && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current align-middle" />}
                  {st.label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-xs text-mist">
                <span className="flex items-center gap-1.5">
                  <FileCode2 size={13} className="text-fade" />
                  {repo.totalFiles} files
                </span>
                <span className="flex items-center gap-1.5">
                  <Braces size={13} className="text-fade" />
                  {repo.totalChunks} chunks
                </span>
                {repo.languages?.length > 0 && (
                  <span className="flex gap-1">
                    {repo.languages.slice(0, 4).map((lang) => (
                      <span key={lang} className="rounded bg-raise px-1.5 py-0.5 font-mono text-[10px] text-mist">
                        {lang}
                      </span>
                    ))}
                  </span>
                )}
                {repo.lastIndexedAt && (
                  <span className="ml-auto text-[11px] text-fade">
                    indexed {new Date(repo.lastIndexedAt).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => onSelectRepo(repo._id)}
                  disabled={repo.status !== "ready"}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    repo.status === "ready"
                      ? "bg-signal-600 text-ink hover:bg-signal-500"
                      : "cursor-not-allowed bg-panel text-fade"
                  }`}
                >
                  {repo.status === "ready" ? "Open" : repo.status === "indexing" || repo.status === "pending" ? "Indexing…" : "Unavailable"}
                </button>
                {repo.status !== "indexing" && repo.status !== "pending" && (
                  <button
                    onClick={() => reindex(repo)}
                    disabled={busy === repo._id}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs text-mist transition-colors hover:text-cloud disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={busy === repo._id ? "animate-spin" : ""} />
                    Reindex
                  </button>
                )}
                <button
                  onClick={() => remove(repo)}
                  disabled={busy === repo._id}
                  className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs text-stop/80 transition-colors hover:border-stop/40 hover:text-stop disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
                {repo.status === "ready" && (
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-go">
                    <CheckCircle2 size={13} />
                    Graph &amp; search ready
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}