import { neo4jDriver } from "../../config/neo4j";
import { GraphQueryResult, GraphNode, GraphRelationship } from "../../types";

export class Neo4jClient {
  private driver = neo4jDriver;

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
          if (value && typeof value === "object" && "labels" in value) {
            nodes.push({
              id: value.elementId,
              labels: value.labels,
              properties: value.properties,
            });
          }
          if (value && typeof value === "object" && "type" in value) {
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
      return result.records.map((r) => r.toObject());
    } finally {
      await session.close();
    }
  }

  async createConstraints(): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (f:File) REQUIRE f.path IS UNIQUE");
      await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (f:Function) REQUIRE (f.name, f.filePath) IS NODE KEY");
      await session.run("CREATE INDEX IF NOT EXISTS FOR (f:Function) ON (f.name)");
      await session.run("CREATE INDEX IF NOT EXISTS FOR (f:Function) ON (f.repoId)");
      await session.run("CREATE INDEX IF NOT EXISTS FOR (c:Class) ON (c.name)");
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

export const neo4jClient = new Neo4jClient();
