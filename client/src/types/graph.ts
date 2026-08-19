export interface GraphNodeData {
  id: string;
  label: string;
  type: "function" | "class" | "file" | "import" | string;
  filePath?: string;
  startLine?: number;
  endLine?: number;
  signature?: string;
  language?: string;
}

export interface GraphEdgeData {
  from: string;
  to: string;
  type: "calls" | "imports" | "contains" | "extends" | "implements" | string;
}

export interface GraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}
