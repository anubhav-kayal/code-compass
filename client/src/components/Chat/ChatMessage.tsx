import type { Message } from "../../types";
import { SourceCitation } from "./SourceCitation";
import { CompassMark } from "../ui/CompassMark";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex animate-fade-up gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-panel/80">
          <CompassMark size={18} />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? "order-first" : ""}`}>
        <div
          className={
            isUser
              ? "rounded-2xl rounded-br-md bg-gradient-to-br from-signal-600 to-signal-700 px-4 py-2.5 text-[15px] leading-relaxed text-ink shadow-glow-soft"
              : "rounded-2xl rounded-tl-md border border-line bg-panel/90 px-4 py-2.5 text-[14.5px] leading-relaxed text-cloud shadow-card"
          }
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.sources.slice(0, 4).map((source, i) => (
              <SourceCitation key={i} source={source} />
            ))}
          </div>
        )}

        <p className={`mt-1 text-[11px] text-fade ${isUser ? "text-right" : ""}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}