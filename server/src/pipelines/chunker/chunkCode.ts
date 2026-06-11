import { ParsedFile } from "../ast-parser/parser";
import { ChunkDocument } from "../../types";

export function chunkCode(
  parsedFiles: ParsedFile[],
  repoId: string
): Omit<ChunkDocument, "_id" | "createdAt">[] {
  const chunks: Omit<ChunkDocument, "_id" | "createdAt">[] = [];

  for (const file of parsedFiles) {
    const filePath = file.filePath;

    if (file.symbols.length === 0) {
      chunks.push(createFileLevelChunk(file, repoId));
    } else {
      for (const symbol of file.symbols) {
        const symbolContent = file.content
          .split("\n")
          .slice(symbol.startLine - 1, symbol.endLine)
          .join("\n");

        chunks.push({
          repoId,
          filePath,
          language: file.language,
          chunkType: symbol.type === "class" || symbol.type === "interface" ? "class" : "function",
          symbolName: symbol.name,
          startLine: symbol.startLine,
          endLine: symbol.endLine,
          content: symbolContent,
          embedding: [],
          metadata: {
            imports: file.imports.map((i) => i.source),
            exports: file.exports,
            classes: file.symbols.filter((s) => s.type === "class").map((s) => s.name),
            functions: file.symbols.filter((s) => s.type === "function").map((s) => s.name),
            dependencies: file.imports.map((i) => i.source),
          },
        });
      }
    }
  }

  return chunks;
}

function createFileLevelChunk(
  file: ParsedFile,
  repoId: string
): Omit<ChunkDocument, "_id" | "createdAt"> {
  return {
    repoId,
    filePath: file.filePath,
    language: file.language,
    chunkType: "module",
    startLine: 1,
    endLine: file.content.split("\n").length,
    content: file.content,
    embedding: [],
    metadata: {
      imports: file.imports.map((i) => i.source),
      exports: file.exports,
      classes: [],
      functions: [],
      dependencies: file.imports.map((i) => i.source),
    },
  };
}
