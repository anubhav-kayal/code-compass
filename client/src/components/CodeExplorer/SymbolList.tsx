import { FunctionSquare } from "lucide-react";

interface SymbolItem {
  name: string;
  type: "function" | "class" | "method" | "interface";
  filePath: string;
  startLine: number;
}

interface SymbolListProps {
  symbols: SymbolItem[];
  onSymbolClick: (symbol: SymbolItem) => void;
}

export function SymbolList({ symbols, onSymbolClick }: SymbolListProps) {
  const grouped = symbols.reduce<Record<string, SymbolItem[]>>((acc, sym) => {
    if (!acc[sym.type]) acc[sym.type] = [];
    acc[sym.type].push(sym);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 px-3">
            {type}s ({items.length})
          </h4>
          {items.map((sym, i) => (
            <button
              key={`${sym.name}-${i}`}
              onClick={() => onSymbolClick(sym)}
              className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors"
            >
              <FunctionSquare size={14} className={sym.type === "class" || sym.type === "interface" ? "text-yellow-500" : "text-blue-500"} />
              <span>{sym.name}</span>
              <span className="text-xs text-gray-600 ml-auto">:{sym.startLine}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
