import { MessageSquare, Search, GitBranch, Settings } from "lucide-react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: "chat" | "search" | "graph" | "settings") => void;
}

const navItems = [
  { id: "chat" as const, label: "Chat", icon: MessageSquare },
  { id: "search" as const, label: "Search", icon: Search },
  { id: "graph" as const, label: "Graph", icon: GitBranch },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-4">
      <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
        <span className="text-white font-bold text-sm">CC</span>
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeView === item.id
                ? "bg-primary-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
            title={item.label}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </aside>
  );
}
