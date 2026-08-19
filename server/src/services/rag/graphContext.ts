import { neo4jClient } from "../neo4j";
import { int } from "neo4j-driver";
import { CallGraphQuery } from "../../types";

export async function getFunctionContext(query: CallGraphQuery): Promise<string> {
  const { functionName, repoId, direction, depth = 2 } = query;

  let cypher = "";
  const params: Record<string, unknown> = { name: functionName, repoId, depth: int(depth) };

  if (direction === "callers" || direction === "both") {
    cypher += `
      MATCH path = (caller:Function)-[:CALLS]->(target:Function {name: $name, repoId: $repoId})
      RETURN caller.name AS name, caller.filePath AS filePath, 'caller' AS relation
    `;
  }
  if (direction === "callees" || direction === "both") {
    const union = direction === "both" ? "UNION" : "";
    cypher += `
      ${union}
      MATCH path = (source:Function {name: $name, repoId: $repoId})-[:CALLS]->(callee:Function)
      RETURN callee.name AS name, callee.filePath AS filePath, 'callee' AS relation
    `;
  }

  if (!cypher) return "";

  try {
    const records = await neo4jClient.runRaw(cypher, params);
    return records
      .map((r) => `  ${r.name} (${r.filePath})`)
      .join("\n");
  } catch {
    return "";
  }
}

export async function getArchitectureSummary(repoId: string): Promise<string> {
  const cypher = `
    MATCH (f:File {repoId: $repoId})-[:CONTAINS]->(func:Function)
    RETURN f.path AS file, collect(func.name) AS functions
    ORDER BY file
  `;

  try {
    const records = await neo4jClient.runRaw(cypher, { repoId });
    return records
      .map(
        (r) =>
          `${r.file}: ${(r.functions as string[])?.join(", ") || "none"}`
      )
      .join("\n");
  } catch {
    return "";
  }
}

export async function getDependencyChain(
  filePath: string,
  repoId: string
): Promise<string> {
  const cypher = `
    MATCH (f:File {path: $path, repoId: $repoId})-[:IMPORTS]->(imp:Import)
    OPTIONAL MATCH (imp)-[:RESOLVES_TO]->(target:File)
    RETURN imp.source AS module, target.path AS resolved
  `;

  try {
    const records = await neo4jClient.runRaw(cypher, { path: filePath, repoId });
    return records
      .map(
        (r) =>
          `  ${r.module} -> ${r.resolved || "unresolved"}`
      )
      .join("\n");
  } catch {
    return "";
  }
}
