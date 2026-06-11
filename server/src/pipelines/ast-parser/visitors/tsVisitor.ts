import { visitJavaScript } from "./jsVisitor";
import { ParsedSymbol, ImportStatement } from "../parser";

export function visitTypeScript(
  content: string
): { symbols: ParsedSymbol[]; imports: ImportStatement[]; exports: string[] } {
  const jsResult = visitJavaScript(content);

  const tsSymbols: ParsedSymbol[] = [...jsResult.symbols];
  const tsImports: ImportStatement[] = [...jsResult.imports];
  const tsExports: string[] = [...jsResult.exports];

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const interfaceMatch = line.match(/^(?:export\s+)?interface\s+(\w+)/);
    if (interfaceMatch) {
      let endLine = i + 1;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === "}" || lines[j].trim().startsWith("}")) {
          endLine = j + 1;
          break;
        }
      }
      tsSymbols.push({
        name: interfaceMatch[1],
        type: "interface",
        startLine: i + 1,
        endLine,
      });
    }

    const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)/);
    if (typeMatch) {
      tsSymbols.push({
        name: typeMatch[1],
        type: "interface",
        startLine: i + 1,
        endLine: i + 1,
      });
    }
  }

  return { symbols: tsSymbols, imports: tsImports, exports: tsExports };
}
