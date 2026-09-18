import { readFile } from "../../utils/fileUtils";
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
      const content = await readFile(file.absolutePath);
      const language = file.language;

      const symbols = extractSymbols(content, language);
      const imports = extractImports(content, language);
      const exports = extractExports(content, language);

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

function extractSymbols(content: string, language: string): ParsedSymbol[] {
  switch (language) {
    case "javascript":
    case "typescript":
      return extractCStyleSymbols(content, language === "typescript");
    case "python":
      return extractPythonSymbols(content);
    case "go":
      return extractGoSymbols(content);
    default:
      return [];
  }
}

const JS_FUNCTION_PATTERNS: { regex: RegExp; type: ParsedSymbol["type"] }[] = [
  { regex: /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s+(\w+)\s*\(/, type: "function" },
  { regex: /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(?[^=]*\)?\s*=>/, type: "function" },
  { regex: /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+(\w+)/, type: "class" },
];

const JS_METHOD_PATTERN = /^\s*(?:public\s+|private\s+|protected\s+|static\s+|async\s+|\*\s*)*(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{/;
const JS_INTERFACE_PATTERN = /^\s*(?:export\s+)?interface\s+(\w+)/;
const JS_TYPE_PATTERN = /^\s*(?:export\s+)?type\s+(\w+)\s*=/;

function extractCStyleSymbols(content: string, isTypeScript: boolean): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];
  const lines = content.split("\n");
  let classDepth = -1;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
      continue;
    }

    let matched = false;

    for (const { regex, type } of JS_FUNCTION_PATTERNS) {
      const match = line.match(regex);
      if (match) {
        const endLine = findBraceBlockEnd(lines, i);
        symbols.push({
          name: match[1],
          type,
          startLine: i + 1,
          endLine: endLine + 1,
          signature: trimmed,
        });
        if (type === "class") {
          classDepth = braceDepth;
        }
        matched = true;
        break;
      }
    }

    if (isTypeScript && !matched) {
      const interfaceMatch = line.match(JS_INTERFACE_PATTERN);
      if (interfaceMatch) {
        const endLine = findBraceBlockEnd(lines, i);
        symbols.push({
          name: interfaceMatch[1],
          type: "interface",
          startLine: i + 1,
          endLine: endLine + 1,
          signature: trimmed,
        });
        matched = true;
      } else {
        const typeMatch = line.match(JS_TYPE_PATTERN);
        if (typeMatch) {
          symbols.push({
            name: typeMatch[1],
            type: "interface",
            startLine: i + 1,
            endLine: i + 1,
            signature: trimmed,
          });
          matched = true;
        }
      }
    }

    // Methods: only recognized while inside a class body (avoids matching every `if (...) {`).
    if (!matched && classDepth >= 0 && braceDepth === classDepth + 1) {
      const methodMatch = line.match(JS_METHOD_PATTERN);
      if (methodMatch && !/^(if|for|while|switch|catch|function)$/.test(methodMatch[1])) {
        const endLine = findBraceBlockEnd(lines, i);
        symbols.push({
          name: methodMatch[1],
          type: "method",
          startLine: i + 1,
          endLine: endLine + 1,
          signature: trimmed,
        });
      }
    }

    for (const ch of line) {
      if (ch === "{") braceDepth++;
      else if (ch === "}") {
        braceDepth--;
        if (classDepth >= 0 && braceDepth <= classDepth) classDepth = -1;
      }
    }
  }

  return symbols;
}

/**
 * Brace-depth block end finder. Strips line comments and string/template
 * literals first so braces inside them don't throw off the count.
 */
function findBraceBlockEnd(lines: string[], start: number): number {
  let depth = 0;
  let opened = false;

  for (let i = start; i < lines.length; i++) {
    const stripped = stripStringsAndComments(lines[i]);
    for (const ch of stripped) {
      if (ch === "{") {
        depth++;
        opened = true;
      } else if (ch === "}") {
        depth--;
        if (opened && depth === 0) return i;
      }
    }
    // Arrow function / one-liner with no braces at all: end at the statement's own line.
    if (!opened && i === start && !stripped.includes("{")) {
      return i;
    }
  }

  return opened ? lines.length - 1 : start;
}

function stripStringsAndComments(line: string): string {
  let result = "";
  let inString: string | null = null;
  let inLineComment = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (inLineComment) break;

    if (inString) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    result += ch;
  }

  return result;
}

function extractPythonSymbols(content: string): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const funcMatch = line.match(/^(\s*)(?:async\s+)?def\s+(\w+)\s*\(/);
    const classMatch = line.match(/^(\s*)class\s+(\w+)/);

    if (funcMatch) {
      const indent = funcMatch[1].length;
      const endLine = findIndentBlockEnd(lines, i, indent);
      symbols.push({
        name: funcMatch[2],
        type: indent > 0 ? "method" : "function",
        startLine: i + 1,
        endLine: endLine + 1,
        signature: line.trim(),
      });
    } else if (classMatch) {
      const indent = classMatch[1].length;
      const endLine = findIndentBlockEnd(lines, i, indent);
      symbols.push({
        name: classMatch[2],
        type: "class",
        startLine: i + 1,
        endLine: endLine + 1,
        signature: line.trim(),
      });
    }
  }

  return symbols;
}

function findIndentBlockEnd(lines: string[], start: number, startIndent: number): number {
  let lastNonBlank = start;
  for (let i = start + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const indent = lines[i].search(/\S/);
    if (indent <= startIndent) return lastNonBlank;
    lastNonBlank = i;
  }
  return lastNonBlank;
}

function extractGoSymbols(content: string): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const funcMatch = line.match(/^func\s+(?:\([^)]*\)\s*)?(\w+)\s*\(/);
    if (funcMatch) {
      const endLine = findBraceBlockEnd(lines, i);
      symbols.push({
        name: funcMatch[1],
        type: /^\(/.test(line.replace(/^func\s+/, "")) ? "method" : "function",
        startLine: i + 1,
        endLine: endLine + 1,
        signature: line.trim(),
      });
      continue;
    }

    const typeMatch = line.match(/^type\s+(\w+)\s+(?:struct|interface)\s*\{/);
    if (typeMatch) {
      const endLine = findBraceBlockEnd(lines, i);
      symbols.push({
        name: typeMatch[1],
        type: line.includes("interface") ? "interface" : "class",
        startLine: i + 1,
        endLine: endLine + 1,
        signature: line.trim(),
      });
    }
  }

  return symbols;
}

function extractImports(content: string, language: string): ImportStatement[] {
  switch (language) {
    case "javascript":
    case "typescript":
      return extractJsImports(content);
    case "python":
      return extractPythonImports(content);
    case "go":
      return extractGoImports(content);
    default:
      return [];
  }
}

function extractJsImports(content: string): ImportStatement[] {
  const imports: ImportStatement[] = [];

  const namedImport = /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g;
  const defaultImport = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const sideEffectImport = /^\s*import\s+['"]([^'"]+)['"]/;
  const requireImport = /(?:const|let|var)\s+(\w+|\{[^}]+\})\s*=\s*require\(['"]([^'"]+)['"]\)/g;

  for (const line of content.split("\n")) {
    let match: RegExpExecArray | null;

    namedImport.lastIndex = 0;
    while ((match = namedImport.exec(line))) {
      for (const name of match[1].split(",")) {
        const cleaned = name.trim().split(/\s+as\s+/)[0].trim();
        if (cleaned) {
          imports.push({ source: match[2], importedName: cleaned, isDefault: false });
        }
      }
    }

    defaultImport.lastIndex = 0;
    while ((match = defaultImport.exec(line))) {
      imports.push({ source: match[2], importedName: match[1], isDefault: true });
    }

    const sideEffectMatch = line.match(sideEffectImport);
    if (sideEffectMatch && !line.includes(" from ")) {
      imports.push({ source: sideEffectMatch[1], importedName: "", isDefault: false });
    }

    requireImport.lastIndex = 0;
    while ((match = requireImport.exec(line))) {
      const name = match[1].startsWith("{") ? match[1].slice(1, -1).trim() : match[1];
      imports.push({ source: match[2], importedName: name, isDefault: !match[1].startsWith("{") });
    }
  }

  return imports;
}

function extractPythonImports(content: string): ImportStatement[] {
  const imports: ImportStatement[] = [];

  for (const line of content.split("\n")) {
    const fromMatch = line.match(/^\s*from\s+(\S+)\s+import\s+(.+)/);
    if (fromMatch) {
      for (const name of fromMatch[2].split(",")) {
        const cleaned = name.trim().split(/\s+as\s+/)[0].trim();
        if (cleaned) {
          imports.push({ source: fromMatch[1], importedName: cleaned, isDefault: false });
        }
      }
      continue;
    }

    const importMatch = line.match(/^\s*import\s+(.+)/);
    if (importMatch) {
      for (const mod of importMatch[1].split(",")) {
        const cleaned = mod.trim().split(/\s+as\s+/)[0].trim();
        if (cleaned) {
          imports.push({ source: cleaned, importedName: cleaned, isDefault: true });
        }
      }
    }
  }

  return imports;
}

function extractGoImports(content: string): ImportStatement[] {
  const imports: ImportStatement[] = [];
  const lines = content.split("\n");
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^import\s*\($/.test(trimmed)) {
      inBlock = true;
      continue;
    }
    if (inBlock && trimmed === ")") {
      inBlock = false;
      continue;
    }

    const single = trimmed.match(/^import\s+"([^"]+)"$/);
    const blockLine = inBlock ? trimmed.match(/^(?:(\w+)\s+)?"([^"]+)"$/) : null;

    if (single) {
      imports.push({ source: single[1], importedName: single[1].split("/").pop() || single[1], isDefault: true });
    } else if (blockLine) {
      imports.push({
        source: blockLine[2],
        importedName: blockLine[1] || blockLine[2].split("/").pop() || blockLine[2],
        isDefault: true,
      });
    }
  }

  return imports;
}

function extractExports(content: string, language: string): string[] {
  const exports: string[] = [];

  if (language === "javascript" || language === "typescript") {
    const patterns = [
      /export\s+(?:default\s+)?(?:async\s+)?(?:function|class)\s+(\w+)/,
      /export\s+(?:const|let|var)\s+(\w+)/,
      /export\s+\{\s*([^}]+)\s*\}/,
    ];

    for (const line of content.split("\n")) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          if (pattern.source.includes("\\{")) {
            for (const name of match[1].split(",")) {
              const cleaned = name.trim().split(/\s+as\s+/).pop()?.trim();
              if (cleaned) exports.push(cleaned);
            }
          } else {
            exports.push(match[1]);
          }
        }
      }
    }
  } else if (language === "go") {
    for (const line of content.split("\n")) {
      const match = line.match(/^func\s+(?:\([^)]*\)\s*)?([A-Z]\w*)\s*\(/);
      if (match) exports.push(match[1]);
    }
  }

  return exports;
}
