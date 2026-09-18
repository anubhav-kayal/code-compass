import { ParsedFile } from "../ast-parser/parser";
import { ChunkDocument } from "../../types";
import { splitLargeFunction, shouldChunkByLines } from "./chunkStrategies";
import { addOverlap } from "./overlapStrategy";

type ChunkPiece = { content: string; startLine: number; endLine: number };
type ChunkOut = Omit<ChunkDocument, "_id" | "createdAt">;

export function chunkCode(parsedFiles: ParsedFile[], repoId: string): ChunkOut[] {
  const chunks: ChunkOut[] = [];

  for (const file of parsedFiles) {
    if (file.symbols.length === 0) {
      chunks.push(...createFileLevelChunks(file, repoId));
    } else {
      for (const symbol of file.symbols) {
        const symbolContent = file.content
          .split("\n")
          .slice(symbol.startLine - 1, symbol.endLine)
          .join("\n");

        const pieces = addOverlap(splitLargeFunction(symbolContent));

        pieces.forEach((piece) => {
          chunks.push({
            repoId,
            filePath: file.filePath,
            language: file.language,
            chunkType: symbol.type === "class" || symbol.type === "interface" ? "class" : "function",
            symbolName: symbol.name,
            // Piece line numbers are relative to the symbol's own content; offset back to file lines.
            startLine: symbol.startLine + piece.startLine - 1,
            endLine: symbol.startLine + piece.endLine - 1,
            content: piece.content,
            embedding: [],
            metadata: buildMetadata(file),
          });
        });
      }
    }
  }

  return chunks;
}

function createFileLevelChunks(file: ParsedFile, repoId: string): ChunkOut[] {
  const lines = file.content.split("\n");

  if (!shouldChunkByLines(lines.length, file.language)) {
    return [
      {
        repoId,
        filePath: file.filePath,
        language: file.language,
        chunkType: "module",
        startLine: 1,
        endLine: lines.length,
        content: file.content,
        embedding: [],
        metadata: buildMetadata(file),
      },
    ];
  }

  const pieces: ChunkPiece[] = addOverlap(splitLargeFunction(file.content));

  return pieces.map((piece) => ({
    repoId,
    filePath: file.filePath,
    language: file.language,
    chunkType: "module",
    startLine: piece.startLine,
    endLine: piece.endLine,
    content: piece.content,
    embedding: [],
    metadata: buildMetadata(file),
  }));
}

function buildMetadata(file: ParsedFile): ChunkOut["metadata"] {
  return {
    imports: file.imports.map((i) => i.source),
    exports: file.exports,
    classes: file.symbols.filter((s) => s.type === "class").map((s) => s.name),
    functions: file.symbols.filter((s) => s.type === "function" || s.type === "method").map((s) => s.name),
    dependencies: file.imports.map((i) => i.source),
  };
}
