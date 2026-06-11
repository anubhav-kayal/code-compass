export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, "<mark class='bg-yellow-500/30 text-yellow-200 rounded px-0.5'>$1</mark>");
}

export function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", go: "go", rs: "rust", java: "java", rb: "ruby",
    php: "php", c: "c", cpp: "cpp", cs: "csharp", swift: "swift",
    kt: "kotlin", scala: "scala", html: "xml", css: "css", json: "json",
    yml: "yaml", yaml: "yaml", md: "markdown", sql: "sql", sh: "bash",
    bash: "bash", zsh: "bash", dockerfile: "dockerfile",
  };
  return map[ext || ""] || "text";
}
