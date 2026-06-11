import { useState, FormEvent } from "react";
import { Search, Code, FileText, Hash } from "lucide-react";
import { searchApi } from "../../services/api";
import type { SourceCitation } from "../../types";
import { CodeViewer } from "../CodeExplorer/CodeViewer";

interface SearchBarProps {
  repoId: string;
}

type SearchType = "code" | "file" | "symbol";

export function SearchBar({ repoId }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("code");
  const [results, setResults] = useState<SourceCitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCode, setSelectedCode] = useState<{ content: string; language: string; fileName: string } | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);

    try {
      const res = await searchApi.search({ q: query, repoId, type: searchType, limit: 30 });
      setResults(res.data.data || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, files, symbols..."
            className="w-full bg-gray-800 text-gray-100 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-700 placeholder-gray-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
          {(["code", "file", "symbol"] as SearchType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSearchType(type)}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                searchType === type ? "bg-primary-600 text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {type === "code" ? <Code size={14} /> : type === "file" ? <FileText size={14} /> : <Hash size={14} />}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => setSelectedCode({ content: r.snippet, language: "typescript", fileName: r.filePath })}
              className="w-full text-left bg-gray-900 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-primary-400 font-mono truncate">{r.filePath}</span>
                <span className="text-xs text-gray-500">:{r.startLine}</span>
              </div>
              <pre className="text-xs text-gray-400 truncate">{r.snippet.slice(0, 200)}</pre>
            </button>
          ))}
          {!isLoading && query && results.length === 0 && (
            <p className="text-gray-500 text-center py-8">No results found</p>
          )}
        </div>

        <div className="sticky top-0">
          {selectedCode && (
            <CodeViewer
              content={selectedCode.content}
              language={selectedCode.language}
              fileName={selectedCode.fileName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
