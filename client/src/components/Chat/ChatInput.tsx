import { useState, FormEvent, KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

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
    <form
      onSubmit={handleSubmit}
      className="border-t border-line bg-abyss/70 px-5 py-4 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl2 border border-line bg-panel/80 p-2 shadow-card transition-all focus-within:border-signal-500/50 focus-within:shadow-glow">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this codebase…"
          rows={1}
          disabled={disabled}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-cloud placeholder-fade focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-600 text-ink transition-all hover:bg-signal-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowUp size={18} strokeWidth={2.4} />
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-fade">
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
}