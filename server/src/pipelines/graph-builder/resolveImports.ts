import path from "path";

const RESOLVABLE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".py", ".go"];

export function isExternalImport(source: string): boolean {
  return !source.startsWith(".") && !source.startsWith("/");
}

/**
 * Resolves relative import sources against the actual set of parsed file
 * paths (all repo-root-relative, posix-separated), instead of guessing a
 * single extension. Returns null for external packages or unmatched paths.
 */
export class ImportResolver {
  private files: Set<string>;

  constructor(files: string[]) {
    this.files = new Set(files);
  }

  resolve(importSource: string, currentFile: string): string | null {
    if (isExternalImport(importSource)) return null;

    const currentDir = path.posix.dirname(currentFile);
    const base = path.posix.normalize(path.posix.join(currentDir, importSource));

    const candidates = [
      base,
      ...RESOLVABLE_EXTENSIONS.map((ext) => `${base}${ext}`),
      ...RESOLVABLE_EXTENSIONS.map((ext) => path.posix.join(base, `index${ext}`)),
    ];

    for (const candidate of candidates) {
      if (this.files.has(candidate)) return candidate;
    }

    return null;
  }
}
