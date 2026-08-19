import { MessageSquare, Search, Network, Settings, Github } from "lucide-react";
import { CompassMark } from "../ui/CompassMark";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: "chat" | "search" | "graph" | "settings") => void;
}

const navItems = [
  { id: "chat" as const, label: "Chat", icon: MessageSquare },
  { id: "search" as const, label: "Search", icon: Search },
  { id: "graph" as const, label: "Graph", icon: Network },
  { id: "settings" as const, label: "Repositories", icon: Settings },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="relative z-10 flex w-[76px] shrink-0 flex-col items-center border-r border-line bg-ink/70 py-4 backdrop-blur-xl">
      <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl2 border border-line bg-panel/70 shadow-glow">
        <CompassMark size={26} />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={item.label}
              aria-label={item.label}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                active
                  ? "bg-signal-500/10 text-signal-400 shadow-glow"
                  : "text-fade hover:bg-panel hover:text-cloud"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              {active && (
                <span className="absolute -left-[19px] h-5 w-[3px] rounded-r-full bg-signal-400 shadow-glow" />
              )}
              <span className="pointer-events-none absolute left-[calc(100%+14px)] z-50 whitespace-nowrap rounded-lg border border-line bg-raise px-2.5 py-1 text-xs font-medium text-cloud opacity-0 shadow-glow-soft transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <a
        href="https://github.com"
        target="_blank"
        rel="noreferrer"
        title="Code-Compass"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-fade transition-colors hover:text-cloud"
      >
        <Github size={18} />
      </a>
    </aside>
  );
}