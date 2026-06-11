import { useState, FormEvent, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4 bg-gray-900">
      <div className="flex gap-3 max-w-4xl mx-auto">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this codebase..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-gray-800 text-gray-100 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-700 placeholder-gray-500"
          style={{ minHeight: "44px", maxHeight: "120px" }}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
