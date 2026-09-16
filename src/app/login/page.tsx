"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.28),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(124,58,237,0.25),transparent_30%),radial-gradient(circle_at_65%_90%,rgba(6,182,212,0.18),transparent_30%)]" />

      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] items-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="hidden lg:block">
            <BrandLogo />

            <div className="mt-24 max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/80" />
                AI-powered business workspace
              </div>

              <h1 className="text-6xl font-black leading-[1.05] tracking-tight">
                Make every part of your business{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  work smarter.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
                BusinessPilot brings your leads, customers, tasks,
                invoices, reports, and team operations into one
                intelligent workspace.
              </p>
            </div>

            <div className="relative mt-14 max-w-2xl">
              <DashboardPreview />

              <div className="absolute -right-6 -top-8 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
                <p className="text-xs text-slate-500">
                  Pipeline value
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-300">
                  $24,850
                </p>

                <p className="mt-1 text-xs text-emerald-400">
                  +18.6% this month
                </p>
              </div>

              <div className="absolute -bottom-7 -left-6 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
                <p className="text-xs text-slate-500">
                  AI productivity
                </p>

                <p className="mt-1 text-2xl font-bold text-cyan-300">
                  10+ tools
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  One secure workspace
                </p>
              </div>
            </div>
          </section>

          <section className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="mb-8 lg:hidden">
                <BrandLogo />
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-9">
                <div className="mb-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">
                    →
                  </div>

                  <p className="text-sm font-semibold text-cyan-300">
                    Welcome back
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-tight">
                    Enter your workspace
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Sign in and continue running your business
                    with clarity.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Work email
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        @
                      </span>

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder="you@company.com"
                        autoComplete="email"
                        required
                        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3.5 pl-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:bg-slate-950 focus:ring-4 focus:ring-cyan-400/10"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-slate-300"
                      >
                        Password
                      </label>

                      <span className="text-xs text-slate-600">
                        Secure login
                      </span>
                    </div>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        •
                      </span>

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3.5 pl-10 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:bg-slate-950 focus:ring-4 focus:ring-cyan-400/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:text-cyan-300"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {message && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-300">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-4 font-bold text-slate-950 shadow-xl shadow-blue-950/30 transition hover:scale-[1.01] hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="relative z-10">
                      {loading
                        ? "Opening workspace..."
                        : "Enter BusinessPilot"}
                    </span>

                    {!loading && (
                      <span className="relative z-10 ml-2 transition group-hover:ml-4">
                        →
                      </span>
                    )}
                  </button>
                </form>

                <div className="my-7 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-semibold tracking-[0.25em] text-slate-600">
                    NEW HERE?
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <a
                  href="/signup"
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200"
                >
                  Create your free workspace
                </a>

                <div className="mt-7 flex items-center justify-center gap-2 text-center text-xs text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Private workspace protection enabled
                </div>
              </div>

              <p className="mt-6 text-center text-xs leading-5 text-slate-600">
                By continuing, you agree to use BusinessPilot
                responsibly for your business operations.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">
        B
      </div>

      <div>
        <p className="text-xl font-bold tracking-tight">
          BusinessPilot
        </p>

        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
          AI workspace
        </p>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>

        <p className="text-xs text-slate-500">
          Business overview
        </p>

        <div className="h-2 w-2 rounded-full bg-cyan-400" />
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-500">
            Today&apos;s focus
          </p>

          <h3 className="mt-2 text-lg font-bold">
            Grow smarter
          </h3>

          <div className="mt-5 space-y-3">
            <PreviewRow
              label="New leads"
              value="24"
              color="bg-cyan-400"
            />

            <PreviewRow
              label="Tasks done"
              value="86%"
              color="bg-emerald-400"
            />

            <PreviewRow
              label="Follow-ups"
              value="08"
              color="bg-violet-400"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Sales performance
            </p>

            <span className="text-xs text-emerald-400">
              +18.6%
            </span>
          </div>

          <div className="mt-5 flex h-28 items-end gap-2">
            <Bar height="35%" />
            <Bar height="50%" />
            <Bar height="42%" />
            <Bar height="65%" />
            <Bar height="58%" />
            <Bar height="78%" />
            <Bar height="95%" active />
          </div>

          <div className="mt-3 flex justify-between text-[10px] text-slate-600">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>

      <span className="text-sm font-bold text-slate-200">
        {value}
      </span>
    </div>
  );
}

function Bar({
  height,
  active = false,
}: {
  height: string;
  active?: boolean;
}) {
  return (
    <div
      style={{ height }}
      className={`flex-1 rounded-t-md ${
        active
          ? "bg-gradient-to-t from-cyan-500 to-violet-400"
          : "bg-slate-700"
      }`}
    />
  );
}
