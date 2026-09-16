"use client";

type AccessMessageProps = {
  moduleName: string;
  allowedRoles: string;
  description?: string;
};

export default function AccessMessage({
  moduleName,
  allowedRoles,
  description,
}: AccessMessageProps) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-amber-400/20 bg-amber-400/[0.06] p-8 text-center shadow-2xl shadow-black/20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-2xl text-amber-300">
          !
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
          Limited access
        </p>

        <h1 className="mt-3 text-2xl font-black text-white">
          {moduleName} access is restricted
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-400">
          {description ||
            `Your current role cannot open the ${moduleName} module.`}
        </p>

        <p className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
          Allowed roles:{" "}
          <span className="font-semibold text-amber-300">
            {allowedRoles}
          </span>
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <a
            href="/dashboard"
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300"
          >
            Back to dashboard
          </a>

          <a
            href="/team"
            className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 hover:border-cyan-400"
          >
            View team
          </a>
        </div>
      </section>
    </main>
  );
}
