import { Chunk } from "../mongo";
import { generateEmbedding } from "../llm";
import { SourceCitation } from "../../types";

export interface RetrievalOptions {
  repoId: string;
  query: string;
  topK?: number;
  minScore?: number;
}

export async function hybridRetrieve(options: RetrievalOptions): Promise<SourceCitation[]> {
  const { repoId, query, topK = 10, minScore = 0.5 } = options;

  const queryEmbedding = await generateEmbedding(query);

  const chunks = await Chunk.aggregate([
    {
      $match: { repoId: require("mongoose").Types.ObjectId.createFromHexString(repoId) },
    },
    {
      $addFields: {
        similarity: {
          $dotProduct: ["$embedding", queryEmbedding],
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
    }));
}

export async function keywordSearch(
  repoId: string,
  query: string,
  limit: number = 20
): Promise<SourceCitation[]> {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const chunks = await Chunk.find({
    repoId: require("mongoose").Types.ObjectId.createFromHexString(repoId),
    $or: [
      { content: regex },
      { symbolName: regex },
      { filePath: regex },
    ],
  })
    .limit(limit)
    .select("filePath startLine endLine content")
    .lean();

  return chunks.map((c: Record<string, unknown>) => ({
    chunkId: (c._id as string).toString(),
    filePath: c.filePath as string,
    startLine: c.startLine as number,
    endLine: c.endLine as number,
    relevance: 1.0,
    snippet: (c.content as string).slice(0, 500),
  }));
}
