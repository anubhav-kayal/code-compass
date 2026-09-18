import { ParsedFile, ParsedSymbol } from "../ast-parser/parser";
import { neo4jClient } from "../../services/neo4j";
import { logger } from "../../utils/logger";
import { extractFunctionCalls, extractInheritanceRelationships, FunctionCall } from "./relationshipExtractor";
import { ImportResolver } from "./resolveImports";

interface ResolvedCall {
  callerName: string;
  callerFile: string;
  calleeName: string;
  calleeFile: string;
}

interface ResolvedInheritance {
  childName: string;
  childFile: string;
  parentName: string;
  parentFile: string;
  type: "extends" | "implements";
}

export async function buildGraph(parsedFiles: ParsedFile[], repoId: string): Promise<void> {
  const session = neo4jClient.session();

  try {
    await session.executeWrite((tx) => writeFilesSymbolsAndImports(tx, parsedFiles, repoId));

    const resolver = new ImportResolver(parsedFiles.map((f) => f.filePath));
    const functionIndex = buildSymbolIndex(parsedFiles, ["function", "method"]);
    const classIndex = buildSymbolIndex(parsedFiles, ["class", "interface"]);

    const calls = resolveCalls(extractFunctionCalls(parsedFiles), parsedFiles, functionIndex, resolver);
    const inheritance = resolveInheritance(extractInheritanceRelationships(parsedFiles), classIndex);

    await session.executeWrite((tx) => writeResolvedRelationships(tx, repoId, calls, inheritance));

    logger.info("Graph built successfully", {
      repoId,
      files: parsedFiles.length,
      calls: calls.length,
      inheritance: inheritance.length,
    });
  } finally {
    await session.close();
  }
}

async function writeFilesSymbolsAndImports(tx: any, parsedFiles: ParsedFile[], repoId: string): Promise<void> {
  const fileRows = parsedFiles.map((f) => ({
    path: f.filePath,
    language: f.language,
    totalLines: f.content.split("\n").length,
  }));

  await tx.run(
    `UNWIND $rows AS row
     MERGE (f:File {path: row.path, repoId: $repoId})
     SET f.language = row.language, f.totalLines = row.totalLines`,
    { rows: fileRows, repoId }
  );

  const functionRows: Record<string, unknown>[] = [];
  const classRows: Record<string, unknown>[] = [];

  for (const file of parsedFiles) {
    for (const symbol of file.symbols) {
      const row = {
        path: file.filePath,
        name: symbol.name,
        startLine: symbol.startLine,
        endLine: symbol.endLine,
        signature: symbol.signature || "",
      };
      if (symbol.type === "function" || symbol.type === "method") {
        functionRows.push({ ...row, isMethod: symbol.type === "method" });
      } else {
        classRows.push({ ...row, isInterface: symbol.type === "interface" });
      }
    }
  }

  if (functionRows.length > 0) {
    await tx.run(
      `UNWIND $rows AS row
       MATCH (f:File {path: row.path, repoId: $repoId})
       MERGE (fn:Function {name: row.name, filePath: row.path, repoId: $repoId})
       SET fn.startLine = row.startLine, fn.endLine = row.endLine,
           fn.signature = row.signature, fn.isMethod = row.isMethod
       MERGE (f)-[:CONTAINS]->(fn)`,
      { rows: functionRows, repoId }
    );
  }

  if (classRows.length > 0) {
    await tx.run(
      `UNWIND $rows AS row
       MATCH (f:File {path: row.path, repoId: $repoId})
       MERGE (c:Class {name: row.name, filePath: row.path, repoId: $repoId})
       SET c.startLine = row.startLine, c.endLine = row.endLine, c.isInterface = row.isInterface
       MERGE (f)-[:CONTAINS]->(c)`,
      { rows: classRows, repoId }
    );
  }

  const importRows = parsedFiles.flatMap((file) =>
    file.imports.map((imp) => ({
      path: file.filePath,
      source: imp.source,
      importedName: imp.importedName,
      isDefault: imp.isDefault,
    }))
  );

  if (importRows.length > 0) {
    await tx.run(
      `UNWIND $rows AS row
       MATCH (f:File {path: row.path, repoId: $repoId})
       MERGE (i:Import {source: row.source, importedName: row.importedName, filePath: row.path, repoId: $repoId})
       SET i.isDefault = row.isDefault
       MERGE (f)-[:IMPORTS]->(i)`,
      { rows: importRows, repoId }
    );

    const resolver = new ImportResolver(parsedFiles.map((f) => f.filePath));
    const resolvedImportRows = importRows
      .map((row) => ({ ...row, targetPath: resolver.resolve(row.source, row.path) }))
      .filter((row) => row.targetPath !== null);

    if (resolvedImportRows.length > 0) {
      await tx.run(
        `UNWIND $rows AS row
         MATCH (i:Import {source: row.source, importedName: row.importedName, filePath: row.path, repoId: $repoId})
         MATCH (target:File {path: row.targetPath, repoId: $repoId})
         MERGE (i)-[:RESOLVES_TO]->(target)`,
        { rows: resolvedImportRows, repoId }
      );
    }
  }
}

async function writeResolvedRelationships(
  tx: any,
  repoId: string,
  calls: ResolvedCall[],
  inheritance: ResolvedInheritance[]
): Promise<void> {
  if (calls.length > 0) {
    await tx.run(
      `UNWIND $rows AS row
       MATCH (caller:Function {name: row.callerName, filePath: row.callerFile, repoId: $repoId})
       MATCH (callee:Function {name: row.calleeName, filePath: row.calleeFile, repoId: $repoId})
       MERGE (caller)-[:CALLS]->(callee)`,
      { rows: calls, repoId }
    );
  }

  if (inheritance.length > 0) {
    const extends_ = inheritance.filter((r) => r.type === "extends");
    const implements_ = inheritance.filter((r) => r.type === "implements");

    if (extends_.length > 0) {
      await tx.run(
        `UNWIND $rows AS row
         MATCH (child:Class {name: row.childName, filePath: row.childFile, repoId: $repoId})
         MATCH (parent:Class {name: row.parentName, filePath: row.parentFile, repoId: $repoId})
         MERGE (child)-[:EXTENDS]->(parent)`,
        { rows: extends_, repoId }
      );
    }

    if (implements_.length > 0) {
      await tx.run(
        `UNWIND $rows AS row
         MATCH (child:Class {name: row.childName, filePath: row.childFile, repoId: $repoId})
         MATCH (parent:Class {name: row.parentName, filePath: row.parentFile, repoId: $repoId})
         MERGE (child)-[:IMPLEMENTS]->(parent)`,
        { rows: implements_, repoId }
      );
    }
  }
}

function buildSymbolIndex(
  parsedFiles: ParsedFile[],
  types: ParsedSymbol["type"][]
): Map<string, { file: string; name: string }[]> {
  const index = new Map<string, { file: string; name: string }[]>();

  for (const file of parsedFiles) {
    for (const symbol of file.symbols) {
      if (!types.includes(symbol.type)) continue;
      const entries = index.get(symbol.name) || [];
      entries.push({ file: file.filePath, name: symbol.name });
      index.set(symbol.name, entries);
    }
  }

  return index;
}

/**
 * Disambiguates each syntactic call site to a specific Function node:
 * prefer a same-file match, then follow the caller file's imports to the
 * resolved source file, then fall back to a globally unique name match.
 * Ambiguous or unresolved calls are dropped rather than guessed, to avoid
 * fabricating edges between unrelated same-named functions.
 */
function resolveCalls(
  rawCalls: FunctionCall[],
  parsedFiles: ParsedFile[],
  functionIndex: Map<string, { file: string; name: string }[]>,
  resolver: ImportResolver
): ResolvedCall[] {
  const filesByPath = new Map(parsedFiles.map((f) => [f.filePath, f]));
  const resolved: ResolvedCall[] = [];
  const seen = new Set<string>();

  for (const call of rawCalls) {
    const candidates = functionIndex.get(call.calleeFunction) || [];
    if (candidates.length === 0) continue;

    let targetFile: string | null = null;

    const sameFile = candidates.find((c) => c.file === call.callerFile);
    if (sameFile) {
      targetFile = sameFile.file;
    } else {
      const callerFile = filesByPath.get(call.callerFile);
      const matchingImport = callerFile?.imports.find((imp) => imp.importedName === call.calleeFunction);
      if (matchingImport) {
        const resolvedPath = resolver.resolve(matchingImport.source, call.callerFile);
        if (resolvedPath && candidates.some((c) => c.file === resolvedPath)) {
          targetFile = resolvedPath;
        }
      }

      if (!targetFile && candidates.length === 1) {
        targetFile = candidates[0].file;
      }
    }

    if (!targetFile) continue;

    const key = `${call.callerFile}::${call.callerFunction}->${targetFile}::${call.calleeFunction}`;
    if (seen.has(key)) continue;
    seen.add(key);

    resolved.push({
      callerName: call.callerFunction,
      callerFile: call.callerFile,
      calleeName: call.calleeFunction,
      calleeFile: targetFile,
    });
  }

  return resolved;
}

function resolveInheritance(
  raw: { child: string; parent: string; type: "extends" | "implements" }[],
  classIndex: Map<string, { file: string; name: string }[]>
): ResolvedInheritance[] {
  const resolved: ResolvedInheritance[] = [];

  for (const rel of raw) {
    const childCandidates = classIndex.get(rel.child) || [];
    const parentCandidates = classIndex.get(rel.parent) || [];
    if (childCandidates.length !== 1 || parentCandidates.length === 0) continue;

    const childFile = childCandidates[0].file;
    const parent = parentCandidates.find((p) => p.file === childFile) || parentCandidates[0];
    if (parentCandidates.length > 1 && parent.file !== childFile) continue;

    resolved.push({
      childName: rel.child,
      childFile,
      parentName: rel.parent,
      parentFile: parent.file,
      type: rel.type,
    });
  }

  return resolved;
}
