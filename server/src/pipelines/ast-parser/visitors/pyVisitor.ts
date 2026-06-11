import { ParsedSymbol, ImportStatement } from "../parser";

export function visitPython(
  content: string
): { symbols: ParsedSymbol[]; imports: ImportStatement[]; exports: string[] } {
  const symbols: ParsedSymbol[] = [];
  const imports: ImportStatement[] = [];
  const exports: string[] = [];

  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const funcMatch = line.match(/^def\s+(\w+)/);
    if (funcMatch) {
      const endLine = findPythonBlockEnd(lines, i);
      symbols.push({
        name: funcMatch[1],
        type: "function",
        startLine: i + 1,
        endLine,
      });
      i = endLine;
      continue;
    }

    const classMatch = line.match(/^class\s+(\w+)/);
    if (classMatch) {
      const endLine = findPythonBlockEnd(lines, i);
      symbols.push({
        name: classMatch[1],
        type: "class",
        startLine: i + 1,
        endLine,
      });
      i = endLine;
      continue;
    }

    const importMatch = line.match(/^(?:from\s+(\S+)\s+)?import\s+(\S+)/);
    if (importMatch) {
      imports.push({
        source: importMatch[1] || importMatch[2],
        importedName: importMatch[2],
        isDefault: !importMatch[1],
      });
    }

    i++;
  }

  return { symbols, imports, exports };
}

function findPythonBlockEnd(lines: string[], start: number): number {
  const startIndent = lines[start].search(/\S/);
  for (let i = start + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const indent = lines[i].search(/\S/);
    if (indent <= startIndent) return i;
  }
  return lines.length;
}
