export interface GraphNodeData {
  id: string;
  label: string;
  type: "function" | "class" | "file" | "import";
  filePath?: string;
  startLine?: number;
}

export interface GraphEdgeData {
  from: string;
  to: string;
  type: "calls" | "imports" | "contains" | "extends" | "implements";
}

export interface GraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}
