"use client";

import { useState } from "react";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  time?: string;
};

export default function ChatMessage({
  role,
  content,
  time,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  async function copyMessage() {
    await navigator.clipboard.writeText(content);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <div
      className={`group flex items-end gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
          ✦
        </div>
      )}

      <div
        className={`max-w-[88%] sm:max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`whitespace-pre-wrap rounded-2xl px-5 py-4 text-sm leading-7 ${
            isUser
              ? "rounded-br-md bg-gradient-to-br from-cyan-300 to-blue-500 font-medium text-slate-950 shadow-lg shadow-cyan-500/10"
              : "rounded-bl-md border border-white/10 bg-white/[0.06] text-slate-300 shadow-xl shadow-black/10"
          }`}
        >
          {content}
        </div>

        <div
          className={`mt-2 flex items-center gap-3 px-1 text-[10px] text-slate-600 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span>{time || (isUser ? "You" : "BusinessPilot AI")}</span>

          {!isUser && (
            <button
              type="button"
              onClick={copyMessage}
              className="opacity-0 transition group-hover:opacity-100 hover:text-cyan-300"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-xs font-semibold text-slate-400 sm:flex">
          You
        </div>
      )}
    </div>
  );
}
