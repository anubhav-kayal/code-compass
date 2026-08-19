import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, FileText, GitBranch, Loader, Network } from "lucide-react";
import { CompassMark } from "../ui/CompassMark";
import { repoApi } from "../../services/api";
import type { Repo } from "../../types";
import { formatDate } from "../../utils/formatting";

interface LandingHeroProps {
  onRepoSelected: (id: string) => void;
  onIndexed?: () => void;
}

const examples = [
  "What's the architecture?",
  "Explain the entry point.",
  "How does auth work here?",
  "Who calls the main function?",
];

export function LandingHero({ onRepoSelected, onIndexed }: LandingHeroProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    repoApi
      .listRepos()
      .then((res) => setRepos(res.data.data || []))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="w-full max-w-2xl animate-fade-up">
        <div className="mb-8 flex items-center justify-center">
          <div className="rounded-2xl border border-line bg-panel/70 p-3 shadow-glow">
            <CompassMark size={44} />
          </div>
        </div>

        <h1 className="text-center font-display text-4xl font-bold leading-tight text-cloud md:text-5xl">
          Map any codebase,
          <br />
          <span className="bg-gradient-to-r from-signal-400 via-signal-500 to-brass-400 bg-clip-text text-transparent">
            in plain language
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-center text-[15px] leading-relaxed text-mist">
          Index a GitHub repository, then chat with it, search its functions, and explore the call
          graph — all without reading a line.
        </p>

        <RepoForm onIndexed={onIndexed} onOpen={onRepoSelected} />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs uppercase tracking-widest text-fade">Try asking</span>
          {examples.map((q) => (
            <span
              key={q}
              className="rounded-full border border-line bg-panel/60 px-3 py-1 font-mono text-[11px] text-mist transition-colors hover:border-signal-500/40 hover:text-signal-300"
            >
              {q}
            </span>
          ))}
        </div>

        {loaded && repos.length > 0 && (
          <div className="mt-10">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-fade">
              <BookOpen size={13} /> Recently indexed
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {repos.slice(0, 4).map((repo) => (
                <button
                  key={repo._id}
                  onClick={() => onRepoSelected(repo._id)}
                  className="group flex items-center gap-3 rounded-xl2 border border-line bg-panel/60 p-3 text-left transition-all hover:border-signal-500/40 hover:bg-raise/60"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-abyss">
                    <GitBranch size={15} className="text-signal-400" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[13px] font-medium text-cloud">
                      {repo.owner}/{repo.name}
                    </span>
                    <span className="block text-[11px] text-fade">
                      {repo.status === "ready" ? (
                        <>
                          {repo.totalFiles} files · {repo.totalChunks} chunks
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-warn">
                          <Loader size={10} className="animate-spin" /> indexing
                        </span>
                      )}
                      {repo.lastIndexedAt ? ` · ${formatDate(repo.lastIndexedAt)}` : ""}
                    </span>
                  </span>
                  <ArrowRight size={15} className="text-fade transition-all group-hover:translate-x-0.5 group-hover:text-signal-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RepoForm({
  onIndexed,
  onOpen,
}: {
  onIndexed?: () => void;
  onOpen: (id: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setStatus("working");
    setMessage("");
    try {
      const res = await repoApi.indexRepo(url.trim());
      const repoId = res.data.data.repoId as string;
      const t = setInterval(async () => {
        try {
          const repo = (await repoApi.getRepo(repoId)).data.data as Repo;
          if (repo.status === "ready") {
            clearInterval(t);
            setStatus("done");
            onIndexed?.();
            onOpen(repoId);
          } else if (repo.status === "failed") {
            clearInterval(t);
            setStatus("error");
            setMessage(repo.error || "Indexing failed.");
          }
        } catch {
          clearInterval(t);
          setStatus("error");
          setMessage("Lost connection to the server.");
        }
      }, 2000);
    } catch {
      setStatus("error");
      setMessage("Could not queue the repository.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-xl">
      <div className="flex gap-2 rounded-xl2 border border-line bg-panel/70 p-1.5 shadow-card transition-all focus-within:border-signal-500/60 focus-within:shadow-glow">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          disabled={status === "working"}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-sm text-cloud placeholder-fade focus:outline-none"
        />
        <button
          type="submit"
          disabled={!url.trim() || status === "working"}
          className="flex items-center gap-2 rounded-xl bg-signal-600 px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-signal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "working" ? (
            <>
              <Loader size={15} className="animate-spin" /> Indexing
            </>
          ) : (
            <>
              <Network size={15} /> Index
            </>
          )}
        </button>
      </div>
      {status === "done" && (
        <p className="mt-2 text-center text-sm text-go">Indexed successfully.</p>
      )}
      {status === "error" && (
        <p className="mt-2 text-center text-sm text-stop">{message || "Something went wrong."}</p>
      )}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-fade">
        <FileText size={12} />
        Clones · parses · embeds · maps the call graph — then answers your questions.
      </p>
    </form>
  );
}