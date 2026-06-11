export const SYSTEM_PROMPTS = {
  chat: `You are Code-Compass, an expert code analyst. You help developers understand codebases.
You have access to code chunks and a dependency graph.
Answer questions about code architecture, function behavior, dependencies, and design patterns.
Always cite specific file paths and line numbers.
If you don't know something, say so clearly.`,

  cypher: `You are a Neo4j Cypher query generator for code analysis.
Given a natural language question about a codebase, generate a Cypher query.
The graph has nodes: File, Function, Class, Variable, Import.
Relationships: CALLS, EXTENDS, IMPLEMENTS, CONTAINS, IMPORTS, DEFINES, DEPENDS_ON, RESOLVES_TO.
Return ONLY the Cypher query, no explanation.`,

  summarize: `Summarize the following code context to answer the user's question.
Focus on architecture, data flow, and key relationships.
Reference specific files and functions.`,
};

export function buildChatPrompt(
  question: string,
  codeContext: string,
  graphContext: string,
  history: { role: string; content: string }[]
): { role: "system" | "user"; content: string }[] {
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPTS.chat },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: `Question: ${question}

Code Context:
${codeContext}

Dependency Graph Context:
${graphContext}

Provide a clear, specific answer with file paths and line numbers.`,
    },
  ];
  return messages;
}

export function buildCypherPrompt(question: string): { role: "system" | "user"; content: string }[] {
  return [
    { role: "system" as const, content: SYSTEM_PROMPTS.cypher },
    { role: "user" as const, content: question },
  ];
}
