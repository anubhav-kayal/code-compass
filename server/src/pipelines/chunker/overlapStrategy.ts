const OVERLAP_LINES = 5;

export function addOverlap(
  chunks: { content: string; startLine: number; endLine: number }[]
): { content: string; startLine: number; endLine: number }[] {
  if (chunks.length <= 1) return chunks;

  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;

    const prevChunk = chunks[i - 1];
    const prevLines = prevChunk.content.split("\n");
    const overlapLines = prevLines.slice(-OVERLAP_LINES);

    return {
      content: [...overlapLines, chunk.content].join("\n"),
      startLine: Math.max(1, chunk.startLine - OVERLAP_LINES),
      endLine: chunk.endLine,
    };
  });
}

export function mergeSmallChunks(
  chunks: { content: string; startLine: number; endLine: number }[],
  minLines: number = 20
): { content: string; startLine: number; endLine: number }[] {
  if (chunks.length <= 1) return chunks;

  const merged: { content: string; startLine: number; endLine: number }[] = [];
  let current = chunks[0];

  for (let i = 1; i < chunks.length; i++) {
    const next = chunks[i];
    const currentLines = current.content.split("\n").length;

    if (currentLines < minLines) {
      current = {
        content: current.content + "\n" + next.content,
        startLine: current.startLine,
        endLine: next.endLine,
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  return merged;
}
