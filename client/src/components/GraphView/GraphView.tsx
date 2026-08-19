import { useEffect, useRef, useState } from "react";
import { Search, ZoomIn, ZoomOut, Maximize2, RefreshCw, Loader, X } from "lucide-react";
import { DataSet } from "vis-data";
import { Network } from "vis-network";
import { graphApi } from "../../services/api";
import type { GraphNodeData, GraphEdgeData } from "../../types";
import { shortPath, fileBaseName } from "../../utils/formatting";
import { CompassMark } from "../ui/CompassMark";

interface GraphViewProps {
  repoId: string;
}

type NodeType = "file" | "function" | "class" | "import";

const TYPES: { id: NodeType; label: string }[] = [
  { id: "file", label: "Files" },
  { id: "function", label: "Functions" },
  { id: "class", label: "Classes" },
  { id: "import", label: "Imports" },
];

const NODE_COLORS: Record<string, { background: string; border: string; highlight: string }> = {
  file: { background: "#0d1a2c", border: "#2fc3ef", highlight: "#5ad8ff" },
  function: { background: "#0b2233", border: "#5ad8ff", highlight: "#9be8ff" },
  class: { background: "#241a0c", border: "#e79a3c", highlight: "#ffd699" },
  import: { background: "#141b2b", border: "#8ca4c8", highlight: "#bcd3f0" },
};

const EDGE_COLORS: Record<string, string> = {
  contains: "#1e2c45",
  imports: "#3b4a63",
  calls: "#2fc3ef",
  resolves_to: "#e79a3c",
  extends: "#e79a3c",
  implements: "#f7b85e",
  defines: "#56688c",
  depends_on: "#56688c",
};

export function GraphView({ repoId }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);
  const dataRef = useRef<{ nodes: any; edges: any } | null>(null);

  const [nodes, setNodes] = useState<GraphNodeData[]>([]);
  const [edges, setEdges] = useState<GraphEdgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<GraphNodeData | null>(null);
  const [query, setQuery] = useState("");
  const [hiddenTypes, setHiddenTypes] = useState<Set<NodeType>>(new Set());

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await graphApi.getRepoGraph(repoId);
      setNodes(res.data.data.nodes || []);
      setEdges(res.data.data.edges || []);
    } catch {
      setError("Failed to load the graph.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [repoId]);

  // Build the vis-network once the data arrives
  useEffect(() => {
    if (nodes.length === 0) return;

    function init() {
      if (!containerRef.current) return;

      const visNodes = new DataSet<any>(
        nodes.map((n) => ({
          id: n.id,
          label: n.type === "file" ? fileBaseName(n.label) : n.label,
          title: nodeTooltip(n),
          shape: n.type === "import" ? "dot" : "box",
          size: n.type === "import" ? 10 : 18,
          margin: { top: 8, bottom: 8, left: 10, right: 10 },
          font: { face: "JetBrains Mono", color: "#dbe6f5", size: 11, strokeWidth: 0 },
          color: { background: NODE_COLORS[n.type]?.background || "#141b2b", border: NODE_COLORS[n.type]?.border || "#56688c", highlight: { background: NODE_COLORS[n.type]?.highlight || "#5ad8ff", border: "#ffffff" }, hover: { background: NODE_COLORS[n.type]?.background, border: NODE_COLORS[n.type]?.highlight } },
          chosen: false,
        }))
      );

      const visEdges = new DataSet<any>(
        edges.map((e) => ({
          from: e.from,
          to: e.to,
          arrows: { to: { enabled: true, scaleFactor: 0.6 } },
          color: { color: EDGE_COLORS[e.type] || "#56688c", highlight: "#ffffff", opacity: 0.85 },
          width: e.type === "calls" ? 1.6 : 1,
          selectionWidth: 2,
          smooth: { type: "continuous" },
        }))
      );

      dataRef.current = { nodes: visNodes, edges: visEdges };

      const network = new Network(containerRef.current, { nodes: visNodes, edges: visEdges }, {
        nodes: { borderWidth: 1.2, color: { border: "#56688c", background: "#141b2b" } },
        physics: { solver: "barnesHut", barnesHut: { gravitationalConstant: -3000, centralGravity: 0.08, springLength: 120, springConstant: 0.04, damping: 0.09 }, stabilization: { iterations: 150 } },
        interaction: { hover: true, tooltipDelay: 120, navigationButtons: false, keyboard: false },
        layout: { improvedLayout: true },
      });

      networkRef.current = network;
      (window as any).__ccGraph = network;
      network.once("stabilizationIterationsDone", () => network.fit({ animation: true }));
      network.on("selectNode", (params: any) => {
        const id = params.nodes[0] as string;
        const node = nodes.find((n) => n.id === id) || null;
        setSelected(node);
        if (node) highlightNeighbors(id);
      });
      network.on("deselectNode", () => {
        setSelected(null);
        resetHighlight();
      });
    }

    init();
    return () => {
      networkRef.current?.destroy();
      networkRef.current = null;
      dataRef.current = null;
    };
  }, [nodes, edges]);

  function nodeTooltip(n: GraphNodeData) {
    const lines = [n.type.toUpperCase(), n.label];
    if (n.filePath) lines.push(`📄 ${shortPath(n.filePath)}`);
    if (n.startLine) lines.push(`line ${n.startLine}`);
    if (n.signature) lines.push(n.signature);
    return lines.join("\n");
  }

  function applyVisibility() {
    if (!dataRef.current) return;
    const { nodes: visNodes, edges: visEdges } = dataRef.current;
    const q = query.trim().toLowerCase();
    const visibleNodes = nodes.filter((n) => {
      if (hiddenTypes.has(n.type as NodeType)) return false;
      if (q) {
        const hay = `${n.label} ${n.filePath || ""} ${n.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = edges.filter(
      (e) => visibleIds.has(e.from) && visibleIds.has(e.to)
    );

    nodes.forEach((n) => {
      visNodes.update({ id: n.id, hidden: !visibleIds.has(n.id) });
    });
    edges.forEach((e) => {
      visEdges.update({ id: `${e.from}-${e.to}-${e.type}`, hidden: !visibleEdges.includes(e) });
    });
    networkRef.current?.fit({ animation: true });
  }

  function highlightNeighbors(id: string) {
    if (!dataRef.current) return;
    const { nodes: visNodes, edges: visEdges } = dataRef.current;
    const neighborIds = new Set<string>([id]);
    edges.forEach((e) => {
      if (e.from === id) neighborIds.add(e.to);
      if (e.to === id) neighborIds.add(e.from);
    });
    nodes.forEach((n) => {
      const isSel = n.id === id;
      const isNb = neighborIds.has(n.id);
      const color = NODE_COLORS[n.type] || { background: "#141b2b", border: "#56688c", highlight: "#9be8ff" };
      visNodes.update({
        id: n.id,
        opacity: isSel ? 1 : isNb ? 1 : 0.15,
        color: { background: color.background, border: isSel ? color.highlight : color.border, highlight: { background: color.highlight, border: "#ffffff" } },
      });
    });
    edges.forEach((e) => {
      const on = e.from === id || e.to === id;
      visEdges.update({ id: `${e.from}-${e.to}-${e.type}`, opacity: on ? 1 : 0.08 });
    });
  }

  function resetHighlight() {
    if (!dataRef.current) return;
    const { nodes: visNodes, edges: visEdges } = dataRef.current;
    nodes.forEach((n) => visNodes.update({ id: n.id, opacity: 1 }));
    edges.forEach((e) => visEdges.update({ id: `${e.from}-${e.to}-${e.type}`, opacity: 1 }));
  }

  useEffect(() => {
    applyVisibility();
  }, [query, hiddenTypes, nodes, edges]);

  function toggleType(t: NodeType) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const counts = TYPES.map((t) => ({
    ...t,
    count: nodes.filter((n) => n.type === t.id).length,
  }));

  const q = query.trim().toLowerCase();
  const visibleCount = nodes.filter(
    (n) => !hiddenTypes.has(n.type as NodeType) && (!q || `${n.label} ${n.filePath || ""} ${n.type}`.toLowerCase().includes(q))
  ).length;

  return (
    <div className="relative flex h-full overflow-hidden">
      <div className="starfield absolute inset-0 opacity-60" />
      <div className="relative min-w-0 flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-mist">
            <Loader size={26} className="animate-spin text-signal-400" />
            <p className="text-sm">Charting the constellation…</p>
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="max-w-sm rounded-xl2 border border-stop/30 bg-panel/80 p-6 text-center">
              <p className="mb-3 text-sm text-stop">{error}</p>
              <button
                onClick={load}
                className="rounded-lg bg-signal-600 px-4 py-2 text-sm font-semibold text-ink hover:bg-signal-500"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && nodes.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="max-w-sm rounded-xl2 border border-dashed border-line bg-panel/60 p-8 text-center">
              <CompassMark size={40} className="mx-auto mb-4" />
              <p className="mb-2 font-display text-lg font-semibold text-cloud">No graph yet</p>
              <p className="text-sm leading-relaxed text-mist">
                Index a repository with functions, classes, or imports to map its structure here.
              </p>
            </div>
          </div>
        )}

        <div ref={containerRef} className="h-full w-full" />

        {/* Overlay controls */}
        {!loading && !error && nodes.length > 0 && (
          <>
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl2 border border-line bg-ink/80 p-2 backdrop-blur-xl">
                <Search size={15} className="ml-1 text-fade" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter nodes…"
                  className="w-40 bg-transparent font-mono text-xs text-cloud placeholder-fade focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-fade hover:text-cloud">
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 rounded-xl2 border border-line bg-ink/80 p-1.5 backdrop-blur-xl">
                <button
                  onClick={() => networkRef.current?.zoomIn()}
                  title="Zoom in"
                  className="rounded-lg p-1.5 text-mist hover:bg-panel hover:text-cloud"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={() => networkRef.current?.zoomOut()}
                  title="Zoom out"
                  className="rounded-lg p-1.5 text-mist hover:bg-panel hover:text-cloud"
                >
                  <ZoomOut size={15} />
                </button>
                <button
                  onClick={() => networkRef.current?.fit({ animation: true })}
                  title="Fit to view"
                  className="rounded-lg p-1.5 text-mist hover:bg-panel hover:text-cloud"
                >
                  <Maximize2 size={15} />
                </button>
                <button
                  onClick={load}
                  title="Refresh"
                  className="rounded-lg p-1.5 text-mist hover:bg-panel hover:text-cloud"
                >
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
              <div className="flex flex-wrap justify-end gap-1.5 rounded-xl2 border border-line bg-ink/80 p-2 backdrop-blur-xl">
                {counts.map((t) => {
                  const off = hiddenTypes.has(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleType(t.id)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        off
                          ? "border-line text-fade opacity-40"
                          : "border-line bg-panel text-cloud hover:border-signal-500/40"
                      }`}
                    >
                      {t.label} <span className="ml-1 font-mono text-fade">{t.count}</span>
                    </button>
                  );
                })}
              </div>
              <p className="rounded-full border border-line bg-ink/70 px-3 py-1 font-mono text-[10px] text-mist backdrop-blur-xl">
                {visibleCount} visible · {edges.length} relations
              </p>
            </div>

            {/* Details panel */}
            {selected && (
              <div className="absolute right-4 bottom-4 top-4 z-20 w-72 animate-fade-up overflow-y-auto rounded-xl2 border border-line bg-ink/85 p-4 shadow-glow-soft backdrop-blur-xl">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span
                    className="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: NODE_COLORS[selected.type]?.highlight || "#9be8ff",
                      background: `${NODE_COLORS[selected.type]?.background || "#141b2b"}66`,
                    }}
                  >
                    {selected.type}
                  </span>
                  <button onClick={() => networkRef.current?.unselectAll()} className="text-fade hover:text-cloud">
                    <X size={15} />
                  </button>
                </div>
                <h3 className="break-all font-display text-lg font-semibold text-cloud">{selected.label}</h3>
                {selected.signature && (
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-line bg-abyss p-2 font-mono text-[11px] leading-relaxed text-signal-300">
                    {selected.signature}
                  </pre>
                )}
                <dl className="mt-4 space-y-2 text-xs">
                  {selected.filePath && (
                    <>
                      <dt className="font-semibold uppercase tracking-wider text-fade">File</dt>
                      <dd className="break-all font-mono text-cloud/90">{shortPath(selected.filePath)}</dd>
                    </>
                  )}
                  {selected.startLine && (
                    <>
                      <dt className="font-semibold uppercase tracking-wider text-fade">Location</dt>
                      <dd className="font-mono text-cloud/90">line {selected.startLine}</dd>
                    </>
                  )}
                  {selected.language && (
                    <>
                      <dt className="font-semibold uppercase tracking-wider text-fade">Language</dt>
                      <dd className="font-mono text-cloud/90">{selected.language}</dd>
                    </>
                  )}
                  <dt className="font-semibold uppercase tracking-wider text-fade">Node ID</dt>
                  <dd className="break-all font-mono text-fade">{selected.id}</dd>
                </dl>
                <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-mist">
                  Connected nodes stay lit, everything else dims. Click elsewhere to clear the focus.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}