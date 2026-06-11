import { ParsedFile } from "../ast-parser/parser";

export interface FunctionCall {
  callerFunction: string;
  callerFile: string;
  calleeFunction: string;
  calleeFile?: string;
}

export function extractFunctionCalls(
  parsedFiles: ParsedFile[]
): FunctionCall[] {
  const calls: FunctionCall[] = [];

  for (const file of parsedFiles) {
    const functionsInFile = file.symbols.filter((s) => s.type === "function");
    const content = file.content;

    for (const fn of functionsInFile) {
      const fnContent = content
        .split("\n")
        .slice(fn.startLine - 1, fn.endLine)
        .join("\n");

      const callMatches = fnContent.matchAll(/(\w+)\s*\(/g);
      for (const match of callMatches) {
        const calleeName = match[1];
        if (calleeName === fn.name) continue;
        if (["if", "while", "for", "switch", "catch", "return", "typeof", "delete", "throw", "new"].includes(calleeName)) continue;

        calls.push({
          callerFunction: fn.name,
          callerFile: file.filePath,
          calleeFunction: calleeName,
        });
      }
    }
  }

  return calls;
}

export function extractInheritanceRelationships(
  parsedFiles: ParsedFile[]
): { child: string; parent: string; type: "extends" | "implements" }[] {
  const relationships: { child: string; parent: string; type: "extends" | "implements" }[] = [];

  for (const file of parsedFiles) {
    for (const line of file.content.split("\n")) {
      const extendsMatch = line.match(/class\s+(\w+)\s+extends\s+(\w+)/);
      if (extendsMatch) {
        relationships.push({
          child: extendsMatch[1],
          parent: extendsMatch[2],
          type: "extends",
        });
      }

      const implementsMatch = line.match(/class\s+(\w+)\s+implements\s+(\w+)/);
      if (implementsMatch) {
        relationships.push({
          child: implementsMatch[1],
          parent: implementsMatch[2],
          type: "implements",
        });
      }
    }
  }

  return relationships;
}
