import { Search, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface GraphControlsProps {
  onSearch?: (query: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
}

export function GraphControls({ onSearch, onZoomIn, onZoomOut, onReset }: GraphControlsProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-900/90 rounded-lg border border-gray-800">
      {onSearch && (
        <div className="flex items-center gap-1 bg-gray-800 rounded px-2">
          <Search size={14} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            onChange={(e) => onSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-200 outline-none w-32 placeholder-gray-600"
          />
        </div>
      )}
      <div className="flex gap-1 border-l border-gray-700 pl-2">
        {onZoomIn && (
          <button onClick={onZoomIn} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
            <ZoomIn size={16} />
          </button>
        )}
        {onZoomOut && (
          <button onClick={onZoomOut} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
            <ZoomOut size={16} />
          </button>
        )}
        {onReset && (
          <button onClick={onReset} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
            <RotateCcw size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
