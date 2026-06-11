import { useEffect, useRef } from "react";

interface GraphNode {
  id: string;
  label: string;
  type: string;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

interface DependencyGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function DependencyGraph({ nodes, edges }: DependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    async function initGraph() {
      const vis = await import("vis-network");
      const data = {
        nodes: new vis.DataSet(
          nodes.map((n) => ({
            id: n.id,
            label: n.label,
            title: `${n.type}: ${n.label}`,
            shape: n.type === "function" ? "ellipse" : n.type === "class" ? "box" : "dot",
            color: n.type === "function" ? "#6366f1" : n.type === "class" ? "#f59e0b" : "#10b981",
            font: { color: "#e2e8f0", size: 12 },
          }))
        ),
        edges: new vis.DataSet(
          edges.map((e) => ({
            from: e.from,
            to: e.to,
            label: e.type,
            arrows: "to",
            color: { color: "#475569", highlight: "#6366f1" },
            font: { color: "#94a3b8", size: 10 },
            smooth: { type: "curvedCW", roundness: 0.2 },
          }))
        ),
      };

      const options = {
        physics: {
          solver: "forceAtlas2Based",
          forceAtlas2Based: { gravitationalConstant: -50, springLength: 200, springConstant: 0.01 },
        },
        interaction: { dragNodes: true, zoomView: true, hover: true },
        height: "100%",
        width: "100%",
        background: "#0f172a",
      };

      new vis.Network(containerRef.current, data, options);
    }

    initGraph();
  }, [nodes, edges]);

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No graph data to display
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
