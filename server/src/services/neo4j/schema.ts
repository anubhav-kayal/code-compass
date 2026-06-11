// Neo4j schema definition for documentation
export const nodeLabels = {
  File: {
    path: "string",
    repoId: "string",
    language: "string",
    totalLines: "number",
  },
  Function: {
    name: "string",
    filePath: "string",
    startLine: "number",
    endLine: "number",
    signature: "string",
    repoId: "string",
  },
  Class: {
    name: "string",
    filePath: "string",
    startLine: "number",
    endLine: "number",
    repoId: "string",
  },
  Variable: {
    name: "string",
    filePath: "string",
    scope: "string",
    kind: "string",
    repoId: "string",
  },
  Import: {
    source: "string",
    importedName: "string",
    isDefault: "boolean",
    repoId: "string",
  },
} as const;

export const relationshipTypes = {
  CALLS: "Function → Function",
  EXTENDS: "Class → Class",
  IMPLEMENTS: "Class → Interface",
  CONTAINS: "File → Function | File → Class",
  IMPORTS: "File → Import",
  DEFINES: "Function → Variable",
  DEPENDS_ON: "Function → Import",
  RESOLVES_TO: "Import → File",
} as const;
