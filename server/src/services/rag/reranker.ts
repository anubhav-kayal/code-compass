import { SourceCitation } from "../../types";

const SEMANTIC_WEIGHT = 0.65;
const KEYWORD_WEIGHT = 0.35;

export function rerankByProximity(
  results: SourceCitation[],
  targetFile?: string,
  targetLine?: number
): SourceCitation[] {
  if (!targetFile && !targetLine) return results;

  return results
    .map((r) => {
      let score = r.relevance;
      if (targetFile && r.filePath === targetFile) {
        score += 0.5;
      }
      if (targetLine && r.startLine <= targetLine && r.endLine >= targetLine) {
        score += 0.3;
      }
      return { ...r, relevance: score };
    })
    .sort((a, b) => b.relevance - a.relevance);
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

/**
 * Both `semantic` (cosine similarity, [-1,1]) and `keyword` (fraction of
 * query terms matched, [0,1]) are already on roughly comparable 0..1
 * scales, so they're combined as a weighted sum rather than concatenated
 * and sorted by two incompatible raw scores. A chunk found by both
 * signals outranks one found by only one — classic hybrid rank fusion.
 */
export function mergeResults(semantic: SourceCitation[], keyword: SourceCitation[]): SourceCitation[] {
  const byKey = new Map<string, SourceCitation & { combinedScore: number }>();

  const keyOf = (r: SourceCitation) => `${r.filePath}:${r.startLine}-${r.endLine}`;

  for (const r of semantic) {
    byKey.set(keyOf(r), { ...r, combinedScore: Math.max(0, r.relevance) * SEMANTIC_WEIGHT });
  }

  for (const r of keyword) {
    const key = keyOf(r);
    const existing = byKey.get(key);
    if (existing) {
      existing.combinedScore += r.relevance * KEYWORD_WEIGHT;
    } else {
      byKey.set(key, { ...r, combinedScore: r.relevance * KEYWORD_WEIGHT });
    }
  }

  return Array.from(byKey.values())
    .map((r) => ({ ...r, relevance: r.combinedScore }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 20);
}
