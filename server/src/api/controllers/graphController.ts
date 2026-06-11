import { Request, Response } from "express";
import { neo4jClient, queries } from "../../services/neo4j";
import { getFunctionContext, getArchitectureSummary, getDependencyChain } from "../../services/rag";
import { AppError } from "../middleware/errorHandler";

export async function getCallers(req: Request, res: Response): Promise<void> {
  const { function: functionName, repoId } = req.query as Record<string, string>;
  const result = await neo4jClient.runQuery(queries.CALLER_QUERY, {
    name: functionName,
    repoId,
  });
  res.json({ success: true, data: result.nodes });
}

export async function getCallees(req: Request, res: Response): Promise<void> {
  const { function: functionName, repoId } = req.query as Record<string, string>;
  const result = await neo4jClient.runQuery(queries.CALLEE_QUERY, {
    name: functionName,
    repoId,
  });
  res.json({ success: true, data: result.nodes });
}

export async function getDependencies(req: Request, res: Response): Promise<void> {
  const { path, repoId } = req.query as Record<string, string>;
  if (!path || !repoId) throw new AppError(400, "path and repoId are required");
  const result = await getDependencyChain(path, repoId);
  res.json({ success: true, data: result });
}

export async function getArchitecture(req: Request, res: Response): Promise<void> {
  const { repoId } = req.query as Record<string, string>;
  if (!repoId) throw new AppError(400, "repoId is required");
  const result = await getArchitectureSummary(repoId);
  res.json({ success: true, data: result });
}

export async function getImpact(req: Request, res: Response): Promise<void> {
  const { function: functionName, repoId, depth } = req.query as Record<string, string>;
  const result = await getFunctionContext({
    functionName,
    repoId,
    direction: "callees",
    depth: parseInt(depth || "2"),
  });
  res.json({ success: true, data: result });
}
