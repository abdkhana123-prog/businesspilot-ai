"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
} from "react";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

export default function ChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      150,
    )}px`;
  }, [value]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!disabled && value.trim()) {
      onSend();
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!disabled && value.trim()) {
        onSend();
      }
    }
  }

  return (
    <div className="border-t border-white/10 bg-[#050816]/90 p-4 backdrop-blur-xl sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl"
      >
        <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-2 shadow-2xl shadow-black/30 transition focus-within:border-cyan-400/50 focus-within:ring-4 focus-within:ring-cyan-400/10">
          <div className="flex items-end gap-2">
            <button
              type="button"
              disabled
              aria-label="Attachment coming soon"
              className="mb-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg text-slate-600 sm:flex"
            >
              +
            </button>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={disabled}
              placeholder="Ask about leads, tasks, invoices, reports, or customers..."
              className="max-h-[150px] min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
            />

            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className="mb-1 flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:from-cyan-200 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span className="hidden sm:inline">
                {disabled ? "Thinking..." : "Send"}
              </span>

              <span className="text-lg">↑</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-3 pb-1 pt-2">
            <span className="text-[10px] text-slate-600">
              BusinessPilot AI
            </span>

            <span className="text-[10px] text-slate-600">
              Enter to send · Shift + Enter for new line
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
