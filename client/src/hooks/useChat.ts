import { useState, useCallback } from "react";
import { chatApi } from "../services/api";
import type { Message } from "../types";

export function useChat(repoId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await chatApi.sendMessage(repoId, content, conversationId);
      const data = res.data.data;
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        sources: data.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Error processing request.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [repoId, conversationId]);

  return { messages, isLoading, sendMessage };
}
