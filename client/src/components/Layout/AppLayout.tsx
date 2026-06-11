import { ReactNode } from "react";

interface AppLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

export function AppLayout({ sidebar, header, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {sidebar}
      <div className="flex-1 flex flex-col overflow-hidden">
        {header}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
