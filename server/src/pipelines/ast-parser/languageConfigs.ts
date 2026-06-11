export interface LanguageConfig {
  name: string;
  extensions: string[];
  commentLine: string;
  commentBlock: [string, string];
  topLevelNodes: string[];
}

export const languageConfigs: Record<string, LanguageConfig> = {
  javascript: {
    name: "JavaScript",
    extensions: [".js", ".jsx"],
    commentLine: "//",
    commentBlock: ["/*", "*/"],
    topLevelNodes: ["function_declaration", "class_declaration", "method_definition", "arrow_function"],
  },
  typescript: {
    name: "TypeScript",
    extensions: [".ts", ".tsx"],
    commentLine: "//",
    commentBlock: ["/*", "*/"],
    topLevelNodes: ["function_declaration", "class_declaration", "method_definition", "interface_declaration"],
  },
  python: {
    name: "Python",
    extensions: [".py"],
    commentLine: "#",
    commentBlock: ['"""', '"""'],
    topLevelNodes: ["function_definition", "class_definition", "async_function_definition"],
  },
  go: {
    name: "Go",
    extensions: [".go"],
    commentLine: "//",
    commentBlock: ["/*", "*/"],
    topLevelNodes: ["function_declaration", "method_declaration", "type_declaration"],
  },
};
