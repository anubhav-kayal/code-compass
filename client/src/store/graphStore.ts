import { create } from "zustand";
import type { GraphNodeData, GraphEdgeData } from "../types";

interface GraphState {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedNodeId: string | null;
  setNodes: (nodes: GraphNodeData[]) => void;
  setEdges: (edges: GraphEdgeData[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  clearGraph: () => set({ nodes: [], edges: [], selectedNodeId: null }),
}));
