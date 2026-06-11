interface IndexProgressProps {
  progress: number;
  stages: {
    clone: string;
    parse: string;
    chunk: string;
    embed: string;
    graph: string;
  };
}

const stageLabels: Record<string, string> = {
  clone: "Cloning repository",
  parse: "Parsing AST",
  chunk: "Chunking code",
  embed: "Generating embeddings",
  graph: "Building dependency graph",
};

export function IndexProgress({ progress, stages }: IndexProgressProps) {
  return (
    <div className="space-y-3">
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-1">
        {Object.entries(stages).map(([key, status]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                status === "completed" ? "bg-green-500" : status === "running" ? "bg-blue-500 animate-pulse" : "bg-gray-700"
              }`}
            />
            <span className={status === "running" ? "text-gray-200" : "text-gray-500"}>
              {stageLabels[key] || key}
            </span>
            {status === "running" && <span className="text-primary-400 text-xs">In progress...</span>}
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
    </div>
  );
}
