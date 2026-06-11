import { readFile } from "../../utils/fileUtils";
import { detectLanguage } from "../../utils/languageDetect";
import { FileEntry } from "../ingestion/detectLanguages";
import { logger } from "../../utils/logger";

export interface ParsedSymbol {
  name: string;
  type: "function" | "class" | "method" | "interface" | "variable";
  startLine: number;
  endLine: number;
  signature?: string;
}

export interface ImportStatement {
  source: string;
  importedName: string;
  isDefault: boolean;
}

export interface ParsedFile {
  filePath: string;
  language: string;
  content: string;
  symbols: ParsedSymbol[];
  imports: ImportStatement[];
  exports: string[];
}

export async function parseFiles(files: FileEntry[]): Promise<ParsedFile[]> {
  const results: ParsedFile[] = [];

  for (const file of files) {
    try {
      const content = await readFile(file.filePath);
      const language = file.language;

      const symbols = extractSymbolsBasic(content, language);
      const imports = extractImportsBasic(content, language);
      const exports = extractExportsBasic(content, language);

      results.push({
        filePath: file.filePath,
        language,
        content,
        symbols,
        imports,
        exports,
      });
    } catch (error) {
      logger.warn("Failed to parse file", { file: file.filePath, error });
    }
  }

  return results;
}

function extractSymbolsBasic(content: string, language: string): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];
  const lines = content.split("\n");
  const config = getPatterns(language);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of config.functionPatterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1] || match[2] || "anonymous";
        let endLine = findBlockEnd(lines, i);
        if (endLine === i) endLine = i + 5;

        symbols.push({
          name,
          type: match[0].startsWith("class") || match[0].startsWith("interface") ? "class" : "function",
          startLine: i + 1,
          endLine: endLine + 1,
          signature: line.trim(),
        });
      }
    }
  }

  return symbols;
}

function findBlockEnd(lines: string[], start: number): number {
  let braceCount = 0;
  let foundOpen = false;

  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{" || ch === "(") {
        foundOpen = true;
        if (ch === "{") braceCount++;
      } else if (ch === "}" || ch === ")") {
        if (ch === "}") braceCount--;
        if (foundOpen && braceCount === 0 && ch === "}") return i;
      }
    }
    if (!foundOpen && i > start) return i;
  }

  return lines.length - 1;
}

function extractImportsBasic(content: string, language: string): ImportStatement[] {
  const imports: ImportStatement[] = [];
  const patterns = getPatterns(language).importPatterns;

  for (const line of content.split("\n")) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        imports.push({
          source: match[1] || match[2] || "",
          importedName: match[2] || match[1] || "",
          isDefault: !match[2] || !!match[1],
        });
      }
    }
  }

  return imports;
}

function extractExportsBasic(content: string, language: string): string[] {
  const exports: string[] = [];
  const patterns = getPatterns(language).exportPatterns;

  for (const line of content.split("\n")) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        exports.push(match[1]);
      }
    }
  }

  return exports;
}

function getPatterns(language: string): {
  functionPatterns: RegExp[];
  importPatterns: RegExp[];
  exportPatterns: RegExp[];
} {
  switch (language) {
    case "javascript":
    case "typescript":
      return {
        functionPatterns: [
          /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
          /^(?:export\s+)?(?:async\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/,
          /^(?:export\s+)?class\s+(\w+)/,
          /^(?:export\s+)?interface\s+(\w+)/,
        ],
        importPatterns: [
          /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/,
          /import\s+\{\s*(\w+)\s*\}\s+from\s+['"]([^'"]+)['"]/,
          /require\(['"]([^'"]+)['"]\)/,
        ],
        exportPatterns: [
          /export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)/,
          /export\s+\{\s*(\w+)\s*\}/,
        ],
      };
    case "python":
      return {
        functionPatterns: [
          /^def\s+(\w+)/,
          /^async\s+def\s+(\w+)/,
          /^class\s+(\w+)/,
        ],
        importPatterns: [
          /^import\s+(\w+)/,
          /^from\s+(\w+)\s+import/,
        ],
        exportPatterns: [],
      };
    default:
      return {
        functionPatterns: [],
        importPatterns: [],
        exportPatterns: [],
      };
  }
}
