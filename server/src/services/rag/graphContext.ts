import { neo4jClient } from "../neo4j";
import { ARCHITECTURE_QUERY } from "../neo4j/queries";
import { CallGraphQuery } from "../../types";

const MAX_DEPTH = 5;

/**
 * Neo4j doesn't allow parameterizing variable-length path bounds
 * (`*1..$depth` is a syntax error), so the depth has to be interpolated
 * into the query text. Clamping it to an integer in [1, MAX_DEPTH] first
 * keeps that safe against injection and against runaway traversals.
 */
function depthRange(depth: number): string {
  const clamped = Math.max(1, Math.min(MAX_DEPTH, Math.trunc(depth) || 1));
  return `1..${clamped}`;
}

export async function getFunctionContext(query: CallGraphQuery): Promise<string> {
  const { functionName, repoId, direction, depth = 2 } = query;
  const range = depthRange(depth);

  let cypher = "";
  const params: Record<string, unknown> = { name: functionName, repoId };

  if (direction === "callers" || direction === "both") {
    cypher += `
      MATCH path = (caller:Function)-[:CALLS*${range}]->(target:Function {name: $name, repoId: $repoId})
      UNWIND nodes(path)[0..-1] AS caller
      RETURN DISTINCT caller.name AS name, caller.filePath AS filePath, 'caller' AS relation, length(path) AS hops
    `;
  }
  if (direction === "callees" || direction === "both") {
    const union = direction === "both" ? "UNION" : "";
    cypher += `
      ${union}
      MATCH path = (source:Function {name: $name, repoId: $repoId})-[:CALLS*${range}]->(callee:Function)
      RETURN DISTINCT callee.name AS name, callee.filePath AS filePath, 'callee' AS relation, length(path) AS hops
    `;
  }

  if (!cypher) return "";

  try {
    const records = await neo4jClient.runRaw(cypher, params);
    if (records.length === 0) return "";
    return records
      .sort((a, b) => (a.hops as number) - (b.hops as number))
      .map((r) => `  [${r.relation}, ${r.hops} hop(s)] ${r.name} (${r.filePath})`)
      .join("\n");
  } catch {
    return "";
  }
}

export async function getArchitectureSummary(repoId: string): Promise<string> {
  try {
    const records = await neo4jClient.runRaw(ARCHITECTURE_QUERY, { repoId });
    return records
      .map((r) => {
        const functions = ((r.functions as string[]) || []).filter(Boolean);
        const classes = ((r.classes as string[]) || []).filter(Boolean);
        const parts = [];
        if (functions.length) parts.push(`functions: ${functions.join(", ")}`);
        if (classes.length) parts.push(`classes: ${classes.join(", ")}`);
        return `${r.filePath}: ${parts.join(" | ") || "none"}`;
      })
      .join("\n");
  } catch {
    return "";
  }
}

export async function getDependencyChain(filePath: string, repoId: string, depth: number = 2): Promise<string> {
  const range = depthRange(depth);
  const cypher = `
    MATCH path = (f:File {path: $path, repoId: $repoId})-[:IMPORTS|RESOLVES_TO*${range}]->(target)
    WHERE target:File
    RETURN DISTINCT target.path AS resolved, length(path) AS hops
    ORDER BY hops
  `;

  try {
    const records = await neo4jClient.runRaw(cypher, { path: filePath, repoId });
    if (records.length === 0) return "";
    return records.map((r) => `  [${r.hops} hop(s)] -> ${r.resolved}`).join("\n");
  } catch {
    return "";
  }
}

/**
 * Multi-hop impact analysis: every function transitively reachable from
 * `functionName` via CALLS edges, grouped by hop distance.
 */
export async function getImpactAnalysis(
  functionName: string,
  repoId: string,
  depth: number = 3
): Promise<{ name: string; filePath: string; hops: number }[]> {
  const range = depthRange(depth);
  const cypher = `
    MATCH path = (source:Function {name: $name, repoId: $repoId})-[:CALLS*${range}]->(affected:Function)
    RETURN DISTINCT affected.name AS name, affected.filePath AS filePath, min(length(path)) AS hops
    ORDER BY hops
    LIMIT 200
  `;

  const records = await neo4jClient.runRaw(cypher, { name: functionName, repoId });
  return records.map((r) => ({
    name: r.name as string,
    filePath: r.filePath as string,
    hops: r.hops as number,
  }));
}
