import path from "path";

export function resolveImportPath(
  importSource: string,
  currentFilePath: string
): string | null {
  if (importSource.startsWith(".") || importSource.startsWith("..")) {
    const currentDir = path.dirname(currentFilePath);
    const resolved = path.resolve(currentDir, importSource);

    const extensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", "/index.ts", "/index.js"];
    for (const ext of extensions) {
      const candidate = resolved + ext;
      if (candidate) return candidate;
    }

    return null;
  }

  return null;
}

export function isExternalImport(source: string): boolean {
  return !source.startsWith(".") && !source.startsWith("..");
}

export class ImportResolver {
  private fileMap: Map<string, string> = new Map();

  constructor(files: string[]) {
    for (const f of files) {
      const basename = path.basename(f, path.extname(f));
      this.fileMap.set(basename, f);
      this.fileMap.set(f, f);
    }
  }

  resolve(importSource: string, currentFile: string): string | null {
    const resolved = resolveImportPath(importSource, currentFile);
    if (resolved) return resolved;

    if (this.fileMap.has(importSource)) {
      return this.fileMap.get(importSource)!;
    }

    const basename = path.basename(importSource, path.extname(importSource));
    return this.fileMap.get(basename) || null;
  }
}
