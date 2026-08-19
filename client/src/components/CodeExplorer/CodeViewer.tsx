import { useState } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark";

interface CodeViewerProps {
  content: string;
  language: string;
  fileName: string;
  startLine?: number;
}

export function CodeViewer({ content, language, fileName, startLine }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-800">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2 border-b border-gray-800">
        <span className="text-sm text-gray-400 font-mono">{fileName}</span>
        <button onClick={handleCopy} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          showLineNumbers
          startingLineNumber={startLine || 1}
          customStyle={{ margin: 0, borderRadius: 0, fontSize: "13px", lineHeight: "1.5" }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
