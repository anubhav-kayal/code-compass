export const CALLER_QUERY = `
  MATCH (caller:Function)-[:CALLS]->(target:Function {name: $name, repoId: $repoId})
  RETURN caller
  ORDER BY caller.name
`;

export const CALLEE_QUERY = `
  MATCH (source:Function {name: $name, repoId: $repoId})-[:CALLS]->(callee:Function)
  RETURN callee
  ORDER BY callee.name
`;

export const IMPACT_ANALYSIS_QUERY = `
  MATCH path = (source:Function {name: $name, repoId: $repoId})-[:CALLS*1..$depth]->(affected)
  RETURN path
  LIMIT 100
`;

export const MODULE_DEPENDENCIES_QUERY = `
  MATCH (f:File {path: $path, repoId: $repoId})-[:IMPORTS]->(imp:Import)-[:RESOLVES_TO]->(target:File)
  RETURN target
`;

export const ARCHITECTURE_QUERY = `
  MATCH (f:File {repoId: $repoId})
  OPTIONAL MATCH (f)-[:CONTAINS]->(func:Function)
  OPTIONAL MATCH (f)-[:CONTAINS]->(cls:Class)
  RETURN f.path AS filePath, collect(DISTINCT func.name) AS functions, collect(DISTINCT cls.name) AS classes
  ORDER BY f.path
`;

export const SYMBOL_SEARCH_QUERY = `
  MATCH (n)
  WHERE n.repoId = $repoId AND toLower(n.name) CONTAINS toLower($query)
  RETURN n
  LIMIT 50
`;

export const IMPORT_GRAPH_QUERY = `
  MATCH (f:File {repoId: $repoId})-[:IMPORTS]->(imp:Import)
  OPTIONAL MATCH (imp)-[:RESOLVES_TO]->(target:File)
  RETURN f.path AS source, imp.source AS importedModule, target.path AS resolvedPath
  ORDER BY source
`;
