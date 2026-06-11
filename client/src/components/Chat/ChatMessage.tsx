import type { Message } from "../../types";
import { SourceCitation } from "./SourceCitation";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isUser ? "order-1" : "order-1"}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser ? "bg-primary-600 text-white" : "bg-gray-800 text-gray-100"
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500 font-medium">Sources:</p>
            {message.sources.slice(0, 3).map((source, i) => (
              <SourceCitation key={i} source={source} />
            ))}
          </div>
        )}

        <p className="text-xs text-gray-600 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
