"use client";

type QuickAction = {
  icon: string;
  title: string;
  description: string;
  prompt: string;
};

type ChatWelcomeProps = {
  userName?: string;
  onAction: (prompt: string) => void;
};

const quickActions: QuickAction[] = [
  {
    icon: "◎",
    title: "Review my leads",
    description: "Find follow-ups and sales opportunities",
    prompt: "Summarize my pending leads and tell me what needs attention.",
  },
  {
    icon: "✓",
    title: "Create a task",
    description: "Add important work to your workspace",
    prompt: "Help me create a new business task.",
  },
  {
    icon: "▥",
    title: "Generate a report",
    description: "Understand today's business performance",
    prompt: "Generate my daily business report.",
  },
  {
    icon: "$",
    title: "Review invoices",
    description: "Check unpaid and overdue invoices",
    prompt: "Show me my unpaid and overdue invoices.",
  },
];

export default function ChatWelcome({
  userName = "there",
  onAction,
}: ChatWelcomeProps) {
  return (
    <section className="mb-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.12] via-blue-500/[0.08] to-violet-500/[0.12] p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">
              ✦
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                BusinessPilot AI
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/70" />

                <span className="text-xs text-emerald-300">
                  Ready to help
                </span>
              </div>
            </div>
          </div>

          <h1 className="max-w-2xl text-3xl font-black tracking-tight text-white sm:text-5xl">
            Good morning, {userName}.
              

            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              What can we get done today?
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            I can help you manage leads, customers, tasks, invoices,
            reports, appointments, and your daily business operations.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                onClick={() => onAction(action.prompt)}
                className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/[0.08]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-lg text-cyan-300 transition group-hover:bg-cyan-300 group-hover:text-slate-950">
                  {action.icon}
                </span>

                <span>
                  <span className="block text-sm font-bold text-slate-100 group-hover:text-cyan-200">
                    {action.title}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {action.description}
                  </span>
                </span>

                <span className="ml-auto text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-2 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Private workspace
        </span>

        <span>AI-powered operations</span>

        <span>Press Enter to send</span>
      </div>
    </section>
  );
}
