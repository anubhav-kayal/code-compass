import { useState } from "react";
import { Sidebar } from "./components/Layout/Sidebar";
import { Header } from "./components/Layout/Header";
import { AppLayout } from "./components/Layout/AppLayout";
import { ChatPanel } from "./components/Chat/ChatPanel";
import { LandingHero } from "./components/Landing/LandingHero";
import { GraphView } from "./components/GraphView/GraphView";
import { RepoManager } from "./components/Settings/RepoManager";
import { SearchBar } from "./components/Search/SearchBar";

type View = "chat" | "search" | "graph" | "settings";

function App() {
  const [activeView, setActiveView] = useState<View>("chat");
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [repoVersion, setRepoVersion] = useState(0);

  function selectRepo(id: string) {
    setActiveRepoId(id);
    setActiveView("chat");
  }

  function showLanding() {
    setActiveRepoId(null);
    setActiveView("chat");
    setRepoVersion((v) => v + 1);
  }

  return (
<AppLayout
        sidebar={<Sidebar activeView={activeView} onViewChange={setActiveView} />}
        header={
          <Header
            activeRepoId={activeRepoId}
            onRepoChange={(id) => (id ? selectRepo(id) : showLanding())}
            onNewRepo={showLanding}
            refreshSignal={repoVersion}
          />
        }
      >
      {!activeRepoId ? (
        <LandingHero
          key={repoVersion}
          onRepoSelected={selectRepo}
          onIndexed={() => setRepoVersion((v) => v + 1)}
        />
      ) : (
        <div className="h-full animate-fade-in">
          {activeView === "chat" && <ChatPanel key={activeRepoId} repoId={activeRepoId} />}
          {activeView === "search" && (
            <div className="h-full overflow-y-auto p-6">
              <SearchBar repoId={activeRepoId} />
            </div>
          )}
          {activeView === "graph" && <GraphView key={activeRepoId} repoId={activeRepoId} />}
          {activeView === "settings" && (
            <RepoManager
              key={repoVersion}
              activeRepoId={activeRepoId}
              onSelectRepo={selectRepo}
              onRepoChange={() => setRepoVersion((v) => v + 1)}
            />
          )}
        </div>
      )}
    </AppLayout>
  );
}

export default App;