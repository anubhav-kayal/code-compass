import { detectLanguage } from "../../utils/languageDetect";
import { listFiles } from "../../utils/fileUtils";

export interface FileEntry {
  filePath: string;
  language: string;
}

export async function detectLanguagesInRepo(repoPath: string): Promise<{
  files: FileEntry[];
  languages: string[];
}> {
  const allFiles = await listFiles(repoPath);
  const files: FileEntry[] = [];

  for (const filePath of allFiles) {
    const language = detectLanguage(filePath);
    if (language) {
      files.push({ filePath, language });
    }
  }

  const languages = [...new Set(files.map((f) => f.language))];

  return { files, languages };
}
