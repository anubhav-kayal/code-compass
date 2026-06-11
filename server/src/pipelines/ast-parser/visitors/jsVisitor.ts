import { ParsedSymbol, ImportStatement } from "../parser";

export function visitJavaScript(
  content: string
): { symbols: ParsedSymbol[]; imports: ImportStatement[]; exports: string[] } {
  const symbols: ParsedSymbol[] = [];
  const imports: ImportStatement[] = [];
  const exports: string[] = [];

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const funcMatch = line.match(
      /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/
    );
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        type: "function",
        startLine: i + 1,
        endLine: findEndLine(lines, i),
      });
    }

    const classMatch = line.match(/^(?:export\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        type: "class",
        startLine: i + 1,
        endLine: findEndLine(lines, i),
      });
    }

    const importMatch = line.match(/import\s+(?:\{\s*(\w+)\s*\}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      imports.push({
        source: importMatch[3],
        importedName: importMatch[1] || importMatch[2],
        isDefault: !!importMatch[2],
      });
    }

    const exportMatch = line.match(/export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)/);
    if (exportMatch) {
      exports.push(exportMatch[1]);
    }
  }

  return { symbols, imports, exports };
}

function findEndLine(lines: string[], start: number): number {
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
