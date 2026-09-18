import mongoose from "mongoose";
import { Chunk } from "../mongo";
import { generateEmbedding } from "../llm";
import { SourceCitation } from "../../types";

export interface RetrievalOptions {
  repoId: string;
  query: string;
  topK?: number;
  minScore?: number;
}

/**
 * Embeddings are stored L2-normalized (see `normalizeVector`), so this dot
 * product is exactly cosine similarity, bounded to [-1, 1].
 */
export async function hybridRetrieve(options: RetrievalOptions): Promise<SourceCitation[]> {
  const { repoId, query, topK = 10, minScore = 0.5 } = options;

  const queryEmbedding = await generateEmbedding(query);

  const chunks = await Chunk.aggregate([
    {
      $match: { repoId: mongoose.Types.ObjectId.createFromHexString(repoId) },
    },
    {
      $addFields: {
        similarity: {
          $reduce: {
            input: { $zip: { inputs: ["$embedding", queryEmbedding] } },
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                {
                  $multiply: [
                    { $arrayElemAt: ["$$this", 0] },
                    { $arrayElemAt: ["$$this", 1] },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    { $sort: { similarity: -1 } },
    { $limit: topK },
    {
      $project: {
        _id: 1,
        filePath: 1,
        startLine: 1,
        endLine: 1,
        content: 1,
        similarity: 1,
        symbolName: 1,
      },
    },
  ]);

  return chunks
    .filter((c) => c.similarity >= minScore)
    .map((c) => ({
      chunkId: c._id.toString(),
      filePath: c.filePath,
      startLine: c.startLine,
      endLine: c.endLine,
      relevance: c.similarity,
      snippet: c.content.slice(0, 500),
      symbolName: c.symbolName,
    }));
}

export async function keywordSearch(
  repoId: string,
  query: string,
  limit: number = 20
): Promise<SourceCitation[]> {
  const terms = query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
    .map(escapeRegex);

  if (terms.length === 0) return [];

  const termRegexes = terms.map((t) => new RegExp(t, "i"));
  const combinedRegex = new RegExp(terms.join("|"), "i");

  const chunks = await Chunk.find({
    repoId: mongoose.Types.ObjectId.createFromHexString(repoId),
    $or: [{ content: combinedRegex }, { symbolName: combinedRegex }, { filePath: combinedRegex }],
  })
    .limit(limit * 3)
    .select("filePath startLine endLine content symbolName")
    .lean();

  return chunks
    .map((c: Record<string, unknown>) => {
      const content = c.content as string;
      const symbolName = (c.symbolName as string) || "";
      const filePath = c.filePath as string;

      // Relevance = fraction of query terms matched, boosted if the match is in the symbol/file name.
      const matchedTerms = termRegexes.filter((r) => r.test(content) || r.test(symbolName) || r.test(filePath));
      const nameBoost = termRegexes.some((r) => r.test(symbolName)) ? 0.2 : 0;
      const relevance = Math.min(1, matchedTerms.length / terms.length + nameBoost);

      return {
        chunkId: (c._id as string).toString(),
        filePath,
        startLine: c.startLine as number,
        endLine: c.endLine as number,
        relevance,
        snippet: content.slice(0, 500),
        symbolName: symbolName || undefined,
      };
    })
    .filter((c) => c.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
