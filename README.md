# Code Compass

Chat with GitHub repositories using Code RAG + GraphRAG. Index any public repo, explore its code via natural language, search functions/classes/dependencies, and visualize the call graph.

## Architecture

```
User Input (GitHub URL / Chat)
        │
        ▼
┌──────────────────────┐
│   Express API Layer  │
└──────┬──────┬────────┘
       │      │
       ▼      ▼
┌─────────┐ ┌───────────────┐
│ MongoDB  │ │    Neo4j      │
│(Chunks,  │ │ (Call Graph,  │
│ Embed-   │ │  Dependencies)│
│ ings,    │ │               │
│ Convos)  │ │               │
└─────────┘ └───────────────┘
       │            │
       ▼            ▼
┌────────────────────────────┐
│     Core Pipelines         │
│                            │
│  Clone → AST Parse →       │
│  Chunk → Embed → Store     │
│                            │
│  Dep. Extraction →         │
│  Graph Build → Store       │
│                            │
│  Query → Retrieve →        │
│  Graph Context → LLM →     │
│  Answer                    │
└────────────────────────────┘
```

## Features

- **AST-Based Code Chunking** — Semantic chunking of functions, classes, and modules with per-language visitors (JS/TS/Python/Go)
- **Neo4j Call Graph** — Dependency graph with CALLS, IMPORTS, CONTAINS, EXTENDS, IMPLEMENTS relationships
- **Hybrid RAG** — Vector search + BM25 keyword search + graph context, merged and reranked
- **Natural Language Chat** — Ask questions about any indexed repo, get answers with source citations
- **Graph-Aware Search** — Find functions, classes, callers, callees, and impact chains
- **Architecture Analysis** — "What layers exist?", "Where is the entry point?", "What depends on this function?"
- **Interactive Graph Visualization** — vis-network powered dependency graph with zoom, pan, and search

## Tech Stack

| Component   | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend    | React 18, Vite, TypeScript, Tailwind CSS      |
| State       | Zustand                                       |
| Backend     | Express, TypeScript                           |
| AST Parser  | Regex-based (extensible to Tree-sitter)       |
| Vector DB   | MongoDB Atlas Vector Search (via aggregation) |
| Graph DB    | Neo4j 5 (with APOC)                           |
| LLM         | OpenAI-compatible API (GPT-4o, Claude, etc.)  |
| Job Queue   | Bull + Redis                                  |
| Containers  | Docker Compose (MongoDB + Neo4j + Redis)      |

## Project Structure

```
code-compass/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/           # ChatPanel, ChatInput, ChatMessage, SourceCitation
│   │   │   ├── CodeExplorer/   # FileTree, CodeViewer, SymbolList
│   │   │   ├── GraphView/      # DependencyGraph, GraphNode, GraphControls
│   │   │   ├── Layout/         # Sidebar, Header, AppLayout
│   │   │   ├── RepoManager/    # RepoInput, RepoStatus, IndexProgress
│   │   │   └── Search/         # SearchBar, SearchResults, SearchFilters
│   │   ├── hooks/              # useChat, useRepo, useGraph, useSearch
│   │   ├── store/              # chatStore, repoStore, graphStore (Zustand)
│   │   ├── services/           # api.ts (Axios), ws.ts (SSE streaming)
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # formatting, highlight
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                     # Express backend
│   ├── src/
│   │   ├── pipelines/
│   │   │   ├── ingestion/      # cloneRepo, detectLanguages, pipeline orchestrator
│   │   │   ├── ast-parser/     # parser.ts, languageConfigs, visitors/
│   │   │   ├── chunker/        # chunkCode, chunkStrategies, overlapStrategy
│   │   │   ├── embedder/       # embedChunks (batch embedding)
│   │   │   └── graph-builder/  # buildCallGraph, relationshipExtractor, resolveImports
│   │   ├── api/
│   │   │   ├── routes/         # repo, chat, search, graph routes
│   │   │   ├── controllers/    # request handlers
│   │   │   └── middleware/     # errorHandler, validateRequest, asyncHandler
│   │   ├── services/
│   │   │   ├── mongo/          # Repo, Chunk, Conversation, IndexJob models
│   │   │   ├── neo4j/          # client, queries (Cypher), schema
│   │   │   ├── llm/            # provider (OpenAI), prompts (chat/cypher/summarize)
│   │   │   ├── rag/            # retriever (hybrid), graphContext, reranker
│   │   │   └── github/         # api.ts, webhook.ts
│   │   ├── jobs/               # Bull queue + indexRepoJob processor
│   │   ├── config/             # index, database, neo4j, llm config
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # logger, fileUtils, languageDetect
│   └── tsconfig.json
│
├── docker-compose.yml          # MongoDB 7 + Neo4j 5 + Redis 7
├── .env.example
├── package.json                # Monorepo workspaces
└── .gitignore
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for MongoDB, Neo4j, Redis)
- An OpenAI-compatible API key

### Setup

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Configure environment
cp .env.example .env
# Edit .env with your LLM_API_KEY

# 3. Install dependencies
npm install

# 4. Run both server and client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Repository
```
POST   /api/repos                    # Index a GitHub repo
GET    /api/repos                    # List all repos
GET    /api/repos/:id                # Get repo details
DELETE /api/repos/:id                # Delete repo and all data
POST   /api/repos/:id/reindex        # Re-index a repo
GET    /api/repos/:id/stats          # Index statistics
```

### Chat
```
POST   /api/chat                     # Ask a question (RAG-based)
GET    /api/chat/conversations       # List conversations
GET    /api/chat/conversations/:id   # Get conversation history
DELETE /api/chat/conversations/:id   # Delete conversation
```

### Search
```
GET    /api/search?q=&repoId=&type=  # Hybrid search (code/file/symbol)
GET    /api/search/symbols           # Graph-based symbol lookup
```

### Graph
```
GET    /api/graph/callers            # Who calls a function
GET    /api/graph/callees            # Whom a function calls
GET    /api/graph/dependencies       # Module dependency chain
GET    /api/graph/architecture       # High-level file/func/class map
GET    /api/graph/impact             # Impact analysis (multi-hop)
```

## Database Schema

### MongoDB Collections

- **Repos** — `githubUrl`, `owner`, `name`, `languages`, `status`, `totalChunks`
- **Chunks** — `filePath`, `language`, `chunkType`, `symbolName`, `content`, `embedding[]`, `metadata`
- **Conversations** — `repoId`, `messages[]` with `sources[]` citations
- **IndexJobs** — `repoId`, `status`, `progress`, `stages` (clone/parse/chunk/embed/graph)

### Neo4j Graph

**Node labels:** `File`, `Function`, `Class`, `Variable`, `Import`

**Relationships:** `CALLS`, `EXTENDS`, `IMPLEMENTS`, `CONTAINS`, `IMPORTS`, `DEFINES`, `DEPENDS_ON`, `RESOLVES_TO`

## How It Works

1. **Submit a GitHub URL** → Repo is cloned, files are detected by language
2. **AST Parsing** → Symbols (functions, classes) and imports are extracted per file
3. **Chunking** → Code is split into semantic units with overlap for context
4. **Embedding** → Each chunk is vectorized via LLM embedding API
5. **Graph Building** → Neo4j nodes and relationships are constructed
6. **Query** → Natural language → hybrid retrieval (vectors + keywords) + graph context → LLM generates answer with citations
