"use client";

import { useState } from "react";

type AIResponseProps = {
  content: string;
};

function formatInlineText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-cyan-200">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-slate-950 px-1.5 py-0.5 text-cyan-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export default function AIResponse({
  content,
}: AIResponseProps) {
  const [copied, setCopied] = useState(false);

  async function copyResponse() {
    await navigator.clipboard.writeText(content);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  const lines = content.split("\n");

  return (
    <div className="group">
      <div className="space-y-2 text-sm leading-7 text-slate-300">
        {lines.map((line, index) => {
          const trimmed = line.trim();

          if (!trimmed) {
            return <div key={index} className="h-2" />;
          }

          if (trimmed.startsWith("### ")) {
            return (
              <h3
                key={index}
                className="pt-2 text-base font-bold text-white"
              >
                {formatInlineText(trimmed.replace("### ", ""))}
              </h3>
            );
          }

          if (trimmed.startsWith("## ")) {
            return (
              <h2
                key={index}
                className="pt-2 text-lg font-bold text-white"
              >
                {formatInlineText(trimmed.replace("## ", ""))}
              </h2>
            );
          }

          if (trimmed.startsWith("# ")) {
            return (
              <h1
                key={index}
                className="pt-2 text-xl font-black text-white"
              >
                {formatInlineText(trimmed.replace("# ", ""))}
              </h1>
            );
          }

          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <div key={index} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                <p>{formatInlineText(trimmed.slice(2))}</p>
              </div>
            );
          }

          const numbered = /^(\d+)\.\s(.+)$/.exec(trimmed);

          if (numbered) {
            return (
              <div key={index} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-300">
                  {numbered[1]}
                </span>

                <p>{formatInlineText(numbered[2])}</p>
              </div>
            );
          }

          if (trimmed.startsWith("> ")) {
            return (
              <blockquote
                key={index}
                className="border-l-2 border-cyan-400/60 pl-4 text-slate-400"
              >
                {formatInlineText(trimmed.slice(2))}
              </blockquote>
            );
          }

          return (
            <p key={index}>{formatInlineText(trimmed)}</p>
          );
        })}
      </div>

      <button
        type="button"
        onClick={copyResponse}
        className="mt-3 text-[11px] text-slate-600 opacity-0 transition hover:text-cyan-300 group-hover:opacity-100"
      >
        {copied ? "Copied" : "Copy response"}
      </button>
    </div>
  );
}
