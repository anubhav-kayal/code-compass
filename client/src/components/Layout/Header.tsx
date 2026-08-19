import { RepoSwitcher } from "../ui/RepoSwitcher";

interface HeaderProps {
  activeRepoId: string | null;
  onRepoChange: (id: string | null) => void;
  onNewRepo: () => void;
  refreshSignal?: number;
}

export function Header({ activeRepoId, onRepoChange, onNewRepo, refreshSignal = 0 }: HeaderProps) {
  return (
    <header className="relative z-10 flex items-center gap-4 border-b border-line bg-abyss/60 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="font-display text-sm font-semibold tracking-tight text-cloud">
          Code<span className="text-signal-400">Compass</span>
        </span>
        <span className="hidden rounded-full border border-line bg-panel px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mist md:inline">
          Alpha
        </span>
      </div>
      <div className="mx-auto" />
      <RepoSwitcher activeRepoId={activeRepoId} onRepoChange={onRepoChange} onNewRepo={onNewRepo} refreshSignal={refreshSignal} />
    </header>
  );
}