import { ParsedFile } from "../ast-parser/parser";
import { neo4jClient } from "../../services/neo4j";
import { logger } from "../../utils/logger";

export async function buildGraph(
  parsedFiles: ParsedFile[],
  repoId: string
): Promise<void> {
  const session = neo4jClient["driver"].session();

  try {
    for (const file of parsedFiles) {
      const relativePath = file.filePath;

      await session.run(
        `MERGE (f:File {path: $path, repoId: $repoId})
         SET f.language = $language, f.totalLines = $totalLines`,
        {
          path: relativePath,
          repoId,
          language: file.language,
          totalLines: file.content.split("\n").length,
        }
      );

      for (const symbol of file.symbols) {
        if (symbol.type === "function") {
          await session.run(
            `MATCH (f:File {path: $path, repoId: $repoId})
             MERGE (fn:Function {name: $name, filePath: $path, repoId: $repoId})
             SET fn.startLine = $startLine, fn.endLine = $endLine, fn.signature = $signature
             MERGE (f)-[:CONTAINS]->(fn)`,
            {
              path: relativePath,
              repoId,
              name: symbol.name,
              startLine: symbol.startLine,
              endLine: symbol.endLine,
              signature: symbol.signature || "",
            }
          );
        } else {
          await session.run(
            `MATCH (f:File {path: $path, repoId: $repoId})
             MERGE (c:Class {name: $name, filePath: $path, repoId: $repoId})
             SET c.startLine = $startLine, c.endLine = $endLine
             MERGE (f)-[:CONTAINS]->(c)`,
            {
              path: relativePath,
              repoId,
              name: symbol.name,
              startLine: symbol.startLine,
              endLine: symbol.endLine,
            }
          );
        }
      }

      for (const imp of file.imports) {
        await session.run(
          `MATCH (f:File {path: $path, repoId: $repoId})
           MERGE (i:Import {source: $source, importedName: $importedName, repoId: $repoId})
           SET i.isDefault = $isDefault
           MERGE (f)-[:IMPORTS]->(i)`,
          {
            path: relativePath,
            repoId,
            source: imp.source,
            importedName: imp.importedName,
            isDefault: imp.isDefault,
          }
        );
      }
    }

    await resolveCrossFileCalls(session, repoId);
    await resolveImportTargets(session, repoId);

    logger.info("Graph built successfully", { repoId, files: parsedFiles.length });
  } finally {
    await session.close();
  }
}

async function resolveCrossFileCalls(session: any, repoId: string): Promise<void> {
  await session.run(
    `MATCH (caller:Function {repoId: $repoId})
     MATCH (callee:Function {repoId: $repoId})
     WHERE caller.name = callee.name AND caller.filePath <> callee.filePath
     MERGE (caller)-[:CALLS]->(callee)`,
    { repoId }
  );
}

async function resolveImportTargets(session: any, repoId: string): Promise<void> {
  await session.run(
    `MATCH (imp:Import {repoId: $repoId})
     MATCH (f:File {repoId: $repoId})
     WHERE f.path CONTAINS replace(imp.source, '.', '/')
     MERGE (imp)-[:RESOLVES_TO]->(f)`,
    { repoId }
  );
}