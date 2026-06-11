import { Request, Response } from "express";
import { Chunk } from "../../services/mongo";
import { hybridRetrieve, keywordSearch } from "../../services/rag";
import { neo4jClient } from "../../services/neo4j";
import { AppError } from "../middleware/errorHandler";

export async function search(req: Request, res: Response): Promise<void> {
  const { q, repoId, type, page, limit } = req.query as Record<string, string>;

  let results;
  if (type === "symbol") {
    const cypher = `
      MATCH (n)
      WHERE n.repoId = $repoId AND toLower(n.name) CONTAINS toLower($query)
      RETURN n.name AS name, n.filePath AS filePath, labels(n) AS type
      LIMIT $limit
    `;
    const graphResult = await neo4jClient.runQuery(cypher, {
      repoId,
      query: q,
      limit: parseInt(limit),
    });
    results = graphResult.nodes.map((n) => ({
      name: n.properties.name,
      filePath: n.properties.filePath,
      type: n.labels[0],
    }));
  } else if (type === "file") {
    const chunks = await Chunk.find({
      repoId: require("mongoose").Types.ObjectId.createFromHexString(repoId),
      filePath: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
    })
      .limit(parseInt(limit))
      .select("filePath language")
      .lean();

    const uniqueFiles = new Map();
    for (const c of chunks) {
      uniqueFiles.set(c.filePath, { filePath: c.filePath, language: c.language });
    }
    results = Array.from(uniqueFiles.values());
  } else {
    const semantic = await hybridRetrieve({
      repoId,
      query: q,
      topK: parseInt(limit),
    });
    const keyword = await keywordSearch(repoId, q, parseInt(limit));
    const seen = new Set<string>();
    results = [...semantic, ...keyword].filter((r) => {
      const key = `${r.filePath}:${r.startLine}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, parseInt(limit));
  }

  res.json({
    success: true,
    data: results,
    pagination: {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      total: results.length,
      totalPages: 1,
    },
  });
}

export async function searchSymbols(req: Request, res: Response): Promise<void> {
  const { query, repoId } = req.query as Record<string, string>;

  if (!query || !repoId) {
    throw new AppError(400, "query and repoId are required");
  }

  const cypher = `
    MATCH (n {repoId: $repoId})
    WHERE toLower(n.name) CONTAINS toLower($query)
    RETURN n
    LIMIT 50
  `;

  const result = await neo4jClient.runQuery(cypher, { repoId, query });
  const symbols = result.nodes.map((n) => ({
    name: n.properties.name,
    filePath: n.properties.filePath,
    type: n.labels[0],
    startLine: n.properties.startLine,
    endLine: n.properties.endLine,
  }));

  res.json({ success: true, data: symbols });
}
