import { useState, FormEvent } from "react";
import { Search, Code2, FileText, Hash, CornerDownLeft, Sparkles } from "lucide-react";
import { searchApi } from "../../services/api";
import type { SourceCitation } from "../../types";
import { CodeViewer } from "../CodeExplorer/CodeViewer";
import { shortPath } from "../../utils/formatting";
import { getLanguageFromFileName } from "../../utils/highlight";

interface SearchBarProps {
  repoId: string;
}

type SearchType = "code" | "file" | "symbol";

interface ResultItem {
  name?: string;
  filePath?: string;
  startLine?: number;
  endLine?: number;
  snippet?: string;
  relevance?: number;
  type?: string;
}

const typeTabs: { id: SearchType; label: string; icon: typeof Code2 }[] = [
  { id: "code", label: "Code", icon: Code2 },
  { id: "file", label: "Files", icon: FileText },
  { id: "symbol", label: "Symbols", icon: Hash },
];

export function SearchBar({ repoId }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("code");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<ResultItem | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setSearched(true);
    setSelected(null);
    try {
      const res = await searchApi.search({ q: query, repoId, type: searchType, limit: 30 });
      setResults(res.data.data || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  function openResult(r: ResultItem) {
    setSelected(r);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="animate-fade-up">
        <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-xl2 border border-line bg-panel/80 p-2 shadow-card transition-all focus-within:border-signal-500/50 focus-within:shadow-glow">
          <Search size={18} className="ml-2 shrink-0 text-fade" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, files, symbols…"
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[15px] text-cloud placeholder-fade focus:outline-none"
          />
          <div className="hidden items-center gap-0.5 rounded-xl bg-abyss p-1 md:flex">
            {typeTabs.map((t) => {
              const Icon = t.icon;
              const active = searchType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSearchType(t.id);
                    setSelected(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? "bg-signal-600 text-ink" : "text-mist hover:text-cloud"
                  }`}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="flex items-center gap-2 rounded-xl bg-signal-600 px-4 py-2 text-sm font-semibold text-ink transition-all hover:bg-signal-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CornerDownLeft size={15} />
            Search
          </button>
        </form>

        {!searched && !isLoading && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-panel/70">
              <Sparkles size={22} className="text-signal-400" />
            </div>
            <p className="text-sm text-mist">
              Search by content, file name, or symbol. Results link straight to source lines.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-mist">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-signal-400" />
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-signal-400 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-signal-400 [animation-delay:300ms]" />
          </div>
        )}

        {searched && !isLoading && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-widest text-fade">
                {results.length} result{results.length === 1 ? "" : "s"}
              </p>
              {results.length === 0 && (
                <div className="rounded-xl2 border border-dashed border-line p-10 text-center text-sm text-mist">
                  Nothing matched “{query}”.
                </div>
              )}
              {results.map((r, i) => (
                <button
                  key={`${r.filePath}-${r.startLine}-${i}`}
                  onClick={() => openResult(r)}
                  className={`w-full rounded-xl2 border p-3.5 text-left transition-all ${
                    selected === r
                      ? "border-signal-500/60 bg-signal-500/10 shadow-glow"
                      : "border-line bg-panel/60 hover:border-signal-500/30 hover:bg-raise/60"
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                        r.type
                          ? "bg-signal-500/10 text-signal-400"
                          : "bg-panel text-fade"
                      }`}
                    >
                      {r.type || searchType}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-mist">
                      {shortPath(r.filePath || "")}
                    </span>
                    {r.startLine ? (
                      <span className="shrink-0 font-mono text-[11px] text-fade">
                        :{r.startLine}
                        {r.endLine && r.endLine !== r.startLine ? `-${r.endLine}` : ""}
                      </span>
                    ) : null}
                  </div>
                  <pre className="truncate text-xs leading-relaxed text-cloud/80">
                    {(r.snippet || r.name || "").slice(0, 220)}
                  </pre>
                  {typeof r.relevance === "number" && r.relevance > 0 && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-abyss">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-signal-500 to-signal-400"
                        style={{ width: `${Math.min(100, Math.round(r.relevance * 100))}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="lg:sticky lg:top-0">
              {selected ? (
                <CodeViewer
                  content={selected.snippet || (selected.name ? `// ${selected.name}` : "No preview")}
                  language={getLanguageFromFileName(selected.filePath || "")}
                  fileName={shortPath(selected.filePath || "")}
                  startLine={selected.startLine || 1}
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-xl2 border border-dashed border-line text-sm text-fade">
                  Select a result to preview the code
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}