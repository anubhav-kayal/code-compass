import { useState } from "react";
import { Sidebar } from "./components/Layout/Sidebar";
import { Header } from "./components/Layout/Header";
import { ChatPanel } from "./components/Chat/ChatPanel";
import { RepoInput } from "./components/RepoManager/RepoInput";
import { SearchBar } from "./components/Search/SearchBar";

type View = "chat" | "search" | "graph" | "settings";

function App() {
  const [activeView, setActiveView] = useState<View>("chat");
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeRepoId={activeRepoId} onRepoChange={setActiveRepoId} />
        <main className="flex-1 overflow-hidden">
          {!activeRepoId ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-lg w-full px-6">
                <h1 className="text-3xl font-bold text-center mb-8 text-white">Code-Compass</h1>
                <p className="text-gray-400 text-center mb-8">
                  Index any GitHub repo and explore its code with AI-powered chat, search, and dependency graphs.
                </p>
                <RepoInput onRepoIndexed={(id) => setActiveRepoId(id)} />
              </div>
            </div>
          ) : (
            <div className="h-full">
              {activeView === "chat" && <ChatPanel repoId={activeRepoId} />}
              {activeView === "search" && (
                <div className="p-6">
                  <SearchBar repoId={activeRepoId} />
                </div>
              )}
              {activeView === "graph" && (
                <div className="p-6 h-full">
                  <p className="text-gray-400">Graph view coming soon...</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
