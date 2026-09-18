import { generateEmbeddings } from "../../services/llm";
import { ChunkDocument } from "../../types";
import { logger } from "../../utils/logger";

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;

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

    const embeddings = await embedBatchWithRetry(texts, i);

    for (let j = 0; j < batch.length; j++) {
      result.push({ ...batch[j], embedding: embeddings[j] });
    }

    logger.info("Embedded batch", { batchSize: batch.length, progress: `${i + batch.length}/${chunks.length}` });
  }

  return result;
}

async function embedBatchWithRetry(texts: string[], batchStart: number): Promise<number[][]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const embeddings = await generateEmbeddings(texts);
      if (embeddings.length !== texts.length || embeddings.some((e) => !e || e.length === 0)) {
        throw new Error("Embedding provider returned incomplete vectors for the batch");
      }
      return embeddings;
    } catch (error) {
      lastError = error;
      logger.warn("Embedding batch attempt failed", { batchStart, attempt, error });
      if (attempt < MAX_ATTEMPTS) {
        await sleep(BASE_RETRY_DELAY_MS * attempt);
      }
    }
  }

  logger.error("Embedding batch failed after retries", { batchStart, error: lastError });
  throw new Error(
    `Failed to embed chunks ${batchStart}-${batchStart + texts.length - 1} after ${MAX_ATTEMPTS} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
