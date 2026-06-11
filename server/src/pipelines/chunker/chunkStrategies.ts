const MAX_CHUNK_SIZE = 1000;
const MIN_CHUNK_SIZE = 50;

export function splitLargeFunction(
  content: string,
  maxLines: number = MAX_CHUNK_SIZE
): { content: string; startLine: number; endLine: number }[] {
  const lines = content.split("\n");
  if (lines.length <= maxLines) {
    return [{ content, startLine: 1, endLine: lines.length }];
  }

  const chunks: { content: string; startLine: number; endLine: number }[] = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    const chunkLines = lines.slice(i, i + maxLines);
    chunks.push({
      content: chunkLines.join("\n"),
      startLine: i + 1,
      endLine: i + chunkLines.length,
    });
  }

  return chunks;
}

export function shouldChunkByLines(
  fileLength: number,
  _language: string
): boolean {
  return fileLength > MIN_CHUNK_SIZE;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
