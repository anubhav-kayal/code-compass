import path from "path";
import { detectLanguage } from "../../utils/languageDetect";
import { listFiles } from "../../utils/fileUtils";

export interface FileEntry {
  /** Path relative to the repo root — stable across re-clones, safe to store. */
  filePath: string;
  /** Absolute path on disk — only valid while the clone exists, used for reading. */
  absolutePath: string;
  language: string;
}

export async function detectLanguagesInRepo(repoPath: string): Promise<{
  files: FileEntry[];
  languages: string[];
}> {
  const allFiles = await listFiles(repoPath);
  const files: FileEntry[] = [];

  for (const absolutePath of allFiles) {
    const language = detectLanguage(absolutePath);
    if (language) {
      const filePath = path.relative(repoPath, absolutePath).split(path.sep).join("/");
      files.push({ filePath, absolutePath, language });
    }
  }

  const languages = [...new Set(files.map((f) => f.language))];

  return { files, languages };
}
