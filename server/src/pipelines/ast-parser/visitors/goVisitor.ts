import { ParsedSymbol, ImportStatement } from "../parser";

export function visitGo(
  content: string
): { symbols: ParsedSymbol[]; imports: ImportStatement[]; exports: string[] } {
  const symbols: ParsedSymbol[] = [];
  const imports: ImportStatement[] = [];
  const exports: string[] = [];

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const funcMatch = line.match(/^func\s+(?:\([^)]+\)\s+)?(\w+)/);
    if (funcMatch) {
      const endLine = findGoBlockEnd(lines, i);
      symbols.push({
        name: funcMatch[1],
        type: "function",
        startLine: i + 1,
        endLine,
        signature: line.trim(),
      });
    }

    const importMatch = line.match(/^import\s+[""]([^""]+)[""]/);
    if (importMatch) {
      imports.push({
        source: importMatch[1],
        importedName: importMatch[1].split("/").pop() || importMatch[1],
        isDefault: true,
      });
    }

    if (funcMatch && /[A-Z]/.test(funcMatch[1][0])) {
      exports.push(funcMatch[1]);
    }
  }

  return { symbols, imports, exports };
}

function findGoBlockEnd(lines: string[], start: number): number {
  let braces = 0;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") braces++;
      if (ch === "}") {
        braces--;
        if (braces === 0) return i + 1;
      }
    }
  }
  return lines.length;
}
