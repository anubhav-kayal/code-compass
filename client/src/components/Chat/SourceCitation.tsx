import { FileCode } from "lucide-react";
import type { SourceCitation as SourceCitationType } from "../../types";
import { shortPath } from "../../utils/formatting";

interface SourceCitationProps {
  source: SourceCitationType;
}

export function SourceCitation({ source }: SourceCitationProps) {
  return (
    <a
      href="#"
      title={source.filePath}
      className="group flex items-center gap-1.5 rounded-lg border border-line bg-raise/60 px-2 py-1 text-[11px] font-mono text-mist transition-all hover:border-signal-500/40 hover:text-signal-300"
    >
      <FileCode size={12} className="shrink-0 text-fade group-hover:text-signal-400" />
      <span className="max-w-[200px] truncate">{shortPath(source.filePath)}</span>
      <span className="text-fade">
        :{source.startLine}
        {source.endLine && source.endLine !== source.startLine ? `-${source.endLine}` : ""}
      </span>
      <span className="rounded bg-signal-500/10 px-1 text-signal-400">
        {(source.relevance * 100).toFixed(0)}%
      </span>
    </a>
  );
}