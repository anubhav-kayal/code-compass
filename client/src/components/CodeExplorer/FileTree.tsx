import { useState } from "react";
import { ChevronRight, ChevronDown, FileCode, Folder } from "lucide-react";

interface FileTreeItem {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileTreeItem[];
}

interface FileTreeProps {
  files: FileTreeItem[];
  onFileSelect: (path: string) => void;
  selectedFile?: string;
}

function FileTreeNode({
  item, depth, onFileSelect, selectedFile,
}: {
  item: FileTreeItem;
  depth: number;
  onFileSelect: (path: string) => void;
  selectedFile?: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (item.type === "directory") {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 w-full text-left px-2 py-1 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Folder size={14} />
          <span>{item.name}</span>
        </button>
        {expanded && item.children?.map((child, i) => (
          <FileTreeNode
            key={`${child.path}-${i}`}
            item={child}
            depth={depth + 1}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(item.path)}
      className={`flex items-center gap-2 w-full text-left px-2 py-1 text-sm rounded transition-colors ${
        selectedFile === item.path
          ? "bg-primary-600/20 text-primary-300"
          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
      }`}
      style={{ paddingLeft: `${depth * 16 + 24}px` }}
    >
      <FileCode size={14} />
      <span className="truncate">{item.name}</span>
    </button>
  );
}

export function FileTree({ files, onFileSelect, selectedFile }: FileTreeProps) {
  return (
    <div className="overflow-y-auto h-full py-2">
      {files.map((item, i) => (
        <FileTreeNode
          key={`${item.path}-${i}`}
          item={item}
          depth={0}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      ))}
    </div>
  );
}
