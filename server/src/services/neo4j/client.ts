import { isNode, isRelationship, isInt } from "neo4j-driver";
import { neo4jDriver } from "../../config/neo4j";
import { GraphQueryResult, GraphNode, GraphRelationship } from "../../types";

export class Neo4jClient {
  private driver = neo4jDriver;

  session() {
    return this.driver.session();
  }

  async runQuery(
    cypher: string,
    params: Record<string, unknown> = {}
  ): Promise<GraphQueryResult> {
    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      const nodes: GraphNode[] = [];
      const relationships: GraphRelationship[] = [];

      for (const record of result.records) {
        for (const key of record.keys) {
          const value = record.get(key);
          if (isNode(value)) {
            nodes.push({
              id: value.elementId,
              labels: value.labels,
              properties: value.properties,
            });
          } else if (isRelationship(value)) {
            relationships.push({
              id: value.elementId,
              type: value.type,
              startNode: {
                id: value.startNodeElementId,
                labels: [],
                properties: {},
              },
              endNode: {
                id: value.endNodeElementId,
                labels: [],
                properties: {},
              },
              properties: value.properties,
            });
          }
        }
      }

      return { nodes, relationships };
    } finally {
      await session.close();
    }
  }

  async runRaw(
    cypher: string,
    params: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records.map((r) => convertIntegers(r.toObject()) as Record<string, unknown>);
    } finally {
      await session.close();
    }
  }

  async createConstraints(): Promise<void> {
    const session = this.driver.session();
    try {
      // Composite NODE KEY / uniqueness constraints are Neo4j Enterprise-only; Community
      // Edition (what docker-compose ships) only supports single-property constraints. We
      // rely on the app always MERGE-ing on the full {name/path, filePath, repoId} property
      // set for correctness, and use plain composite indexes here purely for query speed.
      await session.run("CREATE INDEX IF NOT EXISTS FOR (f:File) ON (f.path, f.repoId)");
      await session.run("CREATE INDEX IF NOT EXISTS FOR (f:Function) ON (f.name, f.filePath, f.repoId)");
      await session.run("CREATE INDEX IF NOT EXISTS FOR (c:Class) ON (c.name, c.filePath, c.repoId)");
      await session.run("CREATE INDEX IF NOT EXISTS FOR (f:Function) ON (f.name)");
      await session.run("CREATE INDEX IF NOT EXISTS FOR (f:Function) ON (f.repoId)");
      await session.run("CREATE INDEX IF NOT EXISTS FOR (c:Class) ON (c.name)");
      await session.run("CREATE INDEX IF NOT EXISTS FOR (n:Import) ON (n.repoId)");
      await session.run("CREATE INDEX IF NOT EXISTS FOR (n:File) ON (n.repoId)");
    } finally {
      await session.close();
    }
  }

  async clearRepo(repoId: string): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(
        `MATCH (n) WHERE n.repoId = $repoId DETACH DELETE n`,
        { repoId }
      );
    } finally {
      await session.close();
    }
  }

  async close(): Promise<void> {
    await this.driver.close();
  }
}

/**
 * Neo4j Integers (e.g. from `length(path)`, `min(...)`, `count(...)`) don't
 * survive JSON.stringify or arithmetic as plain numbers — recursively
 * unwrap them so callers get ordinary JS numbers.
 */
function convertIntegers(value: unknown): unknown {
  if (isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(convertIntegers);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convertIntegers(v)]));
  }
  return value;
}

export const neo4jClient = new Neo4jClient();
