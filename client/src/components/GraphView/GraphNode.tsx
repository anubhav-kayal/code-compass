interface GraphNodeProps {
  id: string;
  label: string;
  type: string;
  isSelected?: boolean;
  onClick?: (id: string) => void;
}

const typeColors: Record<string, string> = {
  function: "border-blue-500 bg-blue-500/10",
  class: "border-yellow-500 bg-yellow-500/10",
  file: "border-green-500 bg-green-500/10",
  import: "border-purple-500 bg-purple-500/10",
};

export function GraphNode({ id, label, type, isSelected, onClick }: GraphNodeProps) {
  const colorClass = typeColors[type] || "border-gray-500 bg-gray-500/10";

  return (
    <button
      onClick={() => onClick?.(id)}
      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
        colorClass
      } ${
        isSelected ? "ring-2 ring-primary-500 scale-105" : "hover:scale-105"
      }`}
    >
      <span className="text-gray-200">{label}</span>
      <span className="text-gray-500 text-xs ml-2">{type}</span>
    </button>
  );
}
