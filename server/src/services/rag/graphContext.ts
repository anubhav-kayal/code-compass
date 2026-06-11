import { neo4jClient } from "../neo4j";
import { CallGraphQuery } from "../../types";

export async function getFunctionContext(query: CallGraphQuery): Promise<string> {
  const { functionName, repoId, direction, depth = 2 } = query;

  let cypher = "";
  const params: Record<string, unknown> = { name: functionName, repoId, depth };

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
    const result = await neo4jClient.runQuery(cypher, params);
    return result.nodes
      .map((n) => `  ${n.properties.name} (${n.properties.filePath})`)
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
    const result = await neo4jClient.runQuery(cypher, { repoId });
    return result.nodes
      .map(
        (n) =>
          `${n.properties.file}: ${(n.properties.functions as string[])?.join(", ") || "none"}`
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
    const result = await neo4jClient.runQuery(cypher, { path: filePath, repoId });
    return result.nodes
      .map(
        (n) =>
          `  ${n.properties.module} -> ${n.properties.resolved || "unresolved"}`
      )
      .join("\n");
  } catch {
    return "";
  }
}
