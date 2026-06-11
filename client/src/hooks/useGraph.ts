import { useState, useCallback } from "react";
import { graphApi } from "../services/api";
import type { GraphNodeData, GraphEdgeData } from "../types";

export function useGraph(repoId: string) {
  const [nodes, setNodes] = useState<GraphNodeData[]>([]);
  const [edges, setEdges] = useState<GraphEdgeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadArchitecture = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await graphApi.getArchitecture(repoId);
      const data = res.data.data;
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch {
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  }, [repoId]);

  const loadCallers = useCallback(async (functionName: string) => {
    setIsLoading(true);
    try {
      const res = await graphApi.getCallers(functionName, repoId);
      const callers = res.data.data || [];
      setNodes(callers);
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  }, [repoId]);

  return { nodes, edges, isLoading, loadArchitecture, loadCallers };
}
