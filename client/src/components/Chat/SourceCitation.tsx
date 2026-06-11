import { FileCode } from "lucide-react";
import type { SourceCitation as SourceCitationType } from "../../types";

interface SourceCitationProps {
  source: SourceCitationType;
}

export function SourceCitation({ source }: SourceCitationProps) {
  return (
    <a
      href="#"
      className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 bg-gray-800/50 rounded-lg px-2 py-1.5 transition-colors"
    >
      <FileCode size={12} />
      <span className="truncate">{source.filePath}</span>
      <span className="text-gray-500">:{source.startLine}-{source.endLine}</span>
      <span className="text-gray-500 ml-auto">{(source.relevance * 100).toFixed(0)}%</span>
    </a>
  );
}
