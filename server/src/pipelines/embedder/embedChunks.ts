import { generateEmbeddings } from "../../services/llm";
import { ChunkDocument } from "../../types";
import { logger } from "../../utils/logger";

const BATCH_SIZE = 20;

export async function embedChunks(
  chunks: Omit<ChunkDocument, "_id" | "createdAt">[]
): Promise<(Omit<ChunkDocument, "_id" | "createdAt"> & { _id?: string; embedding: number[] })[]> {
  const result: (Omit<ChunkDocument, "_id" | "createdAt"> & { _id?: string; embedding: number[] })[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => {
      const header = c.symbolName ? `// ${c.chunkType}: ${c.symbolName}\n` : "";
      const filepath = `// File: ${c.filePath}\n`;
      return `${header}${filepath}${c.content}`;
    });

    try {
      const embeddings = await generateEmbeddings(texts);
      for (let j = 0; j < batch.length; j++) {
        result.push({
          ...batch[j],
          embedding: embeddings[j] || [],
        });
      }
      logger.info("Embedded batch", { batchSize: batch.length, progress: `${i + batch.length}/${chunks.length}` });
    } catch (error) {
      logger.error("Failed to embed batch", { error, batchStart: i });
      for (const chunk of batch) {
        result.push({ ...chunk, embedding: [] });
      }
    }
  }

  return result;
}
