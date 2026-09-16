"use client";

import { useEffect, useState } from "react";

type ChatHistoryItem = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
};

type ChatHistoryProps = {
  activeChatId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
};

const STORAGE_KEY = "businesspilot-chat-history";

export default function ChatHistory({
  activeChatId,
  onNewChat,
  onSelectChat,
}: ChatHistoryProps) {
  const [items, setItems] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      setItems([]);
    }
  }, []);

  function createNewChat() {
    onNewChat();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-lg text-white shadow-xl lg:hidden"
      >
        ☰
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close chat history"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#08111f]/95 p-4 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">
              Conversations
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Your recent AI chats
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-slate-500 hover:text-white lg:hidden"
          >
            ×
          </button>
        </div>

        <button
          type="button"
          onClick={createNewChat}
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:from-cyan-200 hover:to-blue-400"
        >
          <span className="text-lg">+</span>
          New conversation
        </button>

        <div className="mt-6 flex-1 space-y-2 overflow-y-auto">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center">
              <p className="text-sm text-slate-500">
                No previous conversations
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-700">
                Start a new conversation with BusinessPilot AI.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectChat(item.id);
                  setOpen(false);
                }}
                className={`w-full rounded-xl p-3 text-left transition ${
                  activeChatId === item.id
                    ? "border border-cyan-400/30 bg-cyan-400/10"
                    : "border border-transparent hover:bg-white/[0.05]"
                }`}
              >
                <p className="truncate text-sm font-semibold text-slate-200">
                  {item.title}
                </p>

                <p className="mt-1 truncate text-xs text-slate-600">
                  {item.preview}
                </p>

                <p className="mt-2 text-[10px] text-slate-700">
                  {item.updatedAt}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="rounded-xl bg-emerald-400/[0.06] p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <p className="text-xs font-semibold text-emerald-300">
                Private workspace
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              Your chat history is stored locally in this browser.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
