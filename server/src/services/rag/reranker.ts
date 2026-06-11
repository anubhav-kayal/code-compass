import { SourceCitation } from "../../types";

export function rerankByProximity(
  results: SourceCitation[],
  targetFile?: string,
  targetLine?: number
): SourceCitation[] {
  if (!targetFile && !targetLine) return results;

  return results.map((r) => {
    let score = r.relevance;
    if (targetFile && r.filePath === targetFile) {
      score += 0.5;
    }
    if (targetLine && r.startLine <= targetLine && r.endLine >= targetLine) {
      score += 0.3;
    }
    return { ...r, relevance: score };
  }).sort((a, b) => b.relevance - a.relevance);
}

export function deduplicateResults(results: SourceCitation[]): SourceCitation[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.filePath}:${r.startLine}-${r.endLine}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mergeResults(
  semantic: SourceCitation[],
  keyword: SourceCitation[]
): SourceCitation[] {
  const combined = [...semantic, ...keyword];
  const deduped = deduplicateResults(combined);

  deduped.sort((a, b) => b.relevance - a.relevance);
  return deduped.slice(0, 20);
}
