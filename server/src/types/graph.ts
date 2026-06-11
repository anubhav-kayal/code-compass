export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface GraphRelationship {
  id: string;
  type: string;
  startNode: GraphNode;
  endNode: GraphNode;
  properties: Record<string, unknown>;
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

export interface CallGraphQuery {
  functionName: string;
  repoId: string;
  direction: "callers" | "callees" | "both";
  depth?: number;
}
