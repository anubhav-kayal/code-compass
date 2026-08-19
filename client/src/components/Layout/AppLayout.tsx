import { ReactNode } from "react";

interface AppLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

export function AppLayout({ sidebar, header, children }: AppLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden bg-abyss text-cloud">
      <div className="starfield pointer-events-none fixed inset-0" />
      <div className="pointer-events-none fixed -left-40 top-[-20%] h-[480px] w-[480px] rounded-full bg-signal-600/10 blur-[140px]" />
      <div className="pointer-events-none fixed -right-40 bottom-[-20%] h-[420px] w-[420px] rounded-full bg-brass-500/8 blur-[140px]" />
      {sidebar}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {header}
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}