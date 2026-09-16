"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
        ✦
      </div>

      <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-5 py-4 shadow-xl shadow-black/10">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            BusinessPilot is thinking
          </span>

          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
