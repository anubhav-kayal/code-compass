import type { SourceCitation } from "../../types";
import { FileCode } from "lucide-react";

interface SearchResultsProps {
  results: SourceCitation[];
  onResultClick: (result: SourceCitation) => void;
  selectedResult?: SourceCitation | null;
}

export function SearchResults({ results, onResultClick, selectedResult }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p>No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 mb-3">{results.length} results</p>
      {results.map((r, i) => (
        <button
          key={i}
          onClick={() => onResultClick(r)}
          className={`w-full text-left bg-gray-900 border rounded-lg p-3 transition-colors ${
            selectedResult?.chunkId === r.chunkId
              ? "border-primary-500 bg-primary-500/10"
              : "border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-sm text-primary-400 font-mono">
              <FileCode size={14} />
              <span className="truncate">{r.filePath}</span>
            </span>
            <span className="text-xs text-gray-500">
              :{r.startLine}-{r.endLine}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Relevance: {(r.relevance * 100).toFixed(0)}%
          </p>
        </button>
      ))}
    </div>
  );
}
