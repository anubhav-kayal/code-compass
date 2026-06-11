export interface ChunkDocument {
  _id?: string;
  repoId: string;
  filePath: string;
  language: string;
  chunkType: "function" | "class" | "block" | "module" | "comment";
  symbolName?: string;
  startLine: number;
  endLine: number;
  content: string;
  embedding: number[];
  metadata: {
    imports: string[];
    exports: string[];
    classes: string[];
    functions: string[];
    dependencies: string[];
  };
  createdAt?: Date;
}
