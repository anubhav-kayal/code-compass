export interface SourceCitation {
  chunkId: string;
  filePath: string;
  startLine: number;
  endLine: number;
  relevance: number;
  snippet: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  timestamp: Date;
}

export interface Conversation {
  _id: string;
  repoId: string;
  messages: Message[];
}
