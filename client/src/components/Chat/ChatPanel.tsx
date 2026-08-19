import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { chatApi } from "../../services/api";
import type { Message } from "../../types";
import { CompassMark } from "../ui/CompassMark";

interface ChatPanelProps {
  repoId: string;
}

const suggestions = [
  "What's the architecture?",
  "Explain the entry point.",
  "Who calls the main function?",
  "List the key functions and what they do.",
];

export function ChatPanel({ repoId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSend(content: string) {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await chatApi.sendMessage(repoId, content, conversationId);
      const data = res.data.data;

      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        sources: data.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I hit an error answering that. The index may need a refresh — try re-indexing the repo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-6">
          {messages.length === 0 && (
            <div className="animate-fade-up py-16 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-panel/70 shadow-glow">
                <CompassMark size={30} />
              </div>
              <h2 className="font-display text-2xl font-semibold text-cloud">Ask anything about this codebase</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-mist">
                Questions are answered from the indexed code with source citations you can trace.
              </p>
              <div className="mx-auto mt-7 flex max-w-lg flex-wrap items-center justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    disabled={isLoading}
                    className="rounded-full border border-line bg-panel/60 px-3.5 py-1.5 font-mono text-xs text-mist transition-all hover:border-signal-500/50 hover:text-signal-300 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 pl-11">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-signal-400" />
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-signal-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-signal-400 [animation-delay:300ms]" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}