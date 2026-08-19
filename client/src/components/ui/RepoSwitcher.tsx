import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, GitPullRequest, Loader, Plus, RefreshCw, Trash2, Check } from "lucide-react";
import { repoApi } from "../../services/api";
import type { Repo } from "../../types";

interface RepoSwitcherProps {
  activeRepoId: string | null;
  onRepoChange: (id: string | null) => void;
  onNewRepo: () => void;
  refreshSignal?: number;
}

const statusDot: Record<Repo["status"], string> = {
  ready: "bg-go",
  indexing: "bg-warn animate-pulse-dot",
  pending: "bg-mist/60",
  failed: "bg-stop",
};

const statusLabel: Record<Repo["status"], string> = {
  ready: "Ready",
  indexing: "Indexing",
  pending: "Queued",
  failed: "Failed",
};

export function RepoSwitcher({ activeRepoId, onRepoChange, onNewRepo, refreshSignal = 0 }: RepoSwitcherProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeRepo = repos.find((r) => r._id === activeRepoId) || null;

  async function refresh() {
    const res = await repoApi.listRepos();
    setRepos(res.data.data || []);
  }

  useEffect(() => {
    refresh();
  }, [refreshSignal]);

  // Auto-refresh while anything is indexing/pending
  useEffect(() => {
    if (!repos.some((r) => r.status === "indexing" || r.status === "pending")) return;
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [repos]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleReindex(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setBusy(id);
    try {
      await repoApi.reindexRepo(id);
      setTimeout(refresh, 500);
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!window.confirm("Delete this repository and all its indexed data?")) return;
    setBusy(id);
    try {
      await repoApi.deleteRepo(id);
      if (id === activeRepoId) onRepoChange(null);
      refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-xl2 border border-line bg-panel/70 px-3 py-2 text-left hover:border-signal-500/50 hover:bg-raise/60 transition-colors group"
      >
        {activeRepo ? (
          <>
            <span
              className={`h-2 w-2 rounded-full ${statusDot[activeRepo.status]} ${
                activeRepo.status === "ready" ? "" : "animate-pulse-dot"
              }`}
            />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold text-cloud">
                {activeRepo.owner}/{activeRepo.name}
              </span>
              <span className="text-[11px] text-mist">
                {statusLabel[activeRepo.status]} · {activeRepo.totalFiles} files · {activeRepo.totalChunks} chunks
              </span>
            </span>
          </>
        ) : (
          <span className="text-sm text-mist">Select a repository…</span>
        )}
        <ChevronsUpDown size={15} className="ml-1 text-fade group-hover:text-mist transition-colors" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-80 animate-fade-up rounded-xl2 border border-line bg-raise/95 p-2 shadow-glow-soft backdrop-blur-xl">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-widest text-fade">
            Repositories
          </p>
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {repos.map((repo) => (
              <div
                key={repo._id}
                onClick={() => {
                  onRepoChange(repo._id);
                  setOpen(false);
                }}
                className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  repo._id === activeRepoId ? "bg-signal-500/10 text-cloud" : "hover:bg-panel text-mist"
                }`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[repo.status]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[13px]">
                    {repo.owner}/{repo.name}
                  </span>
                  <span className="block text-[11px] text-fade">
                    {statusLabel[repo.status]}
                    {repo.languages.length > 0 && ` · ${repo.languages.slice(0, 3).join(", ")}`}
                  </span>
                </span>
                {repo._id === activeRepoId && <Check size={14} className="shrink-0 text-signal-400" />}
                {repo.status === "indexing" && <Loader size={14} className="shrink-0 animate-spin text-warn" />}
                <div className="hidden items-center gap-0.5 group-hover:flex">
                  <button
                    title="Re-index"
                    onClick={(e) => handleReindex(e, repo._id)}
                    className="rounded-lg p-1.5 text-fade hover:bg-panel hover:text-cloud transition-colors"
                  >
                    {busy === repo._id ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => handleDelete(e, repo._id)}
                    className="rounded-lg p-1.5 text-fade hover:bg-stop/10 hover:text-stop transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {repos.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-fade">No repositories indexed yet.</p>
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onNewRepo();
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-line px-3 py-2.5 text-sm text-signal-400 hover:text-signal-300 transition-colors"
          >
            <Plus size={15} />
            Index a new repository
          </button>
        </div>
      )}
    </div>
  );
}