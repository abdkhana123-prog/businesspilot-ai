"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.href = "/dashboard";
      return;
    }

    setMessage(
      "Account created. Check your email to confirm your account, then log in.",
    );
    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.28),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(124,58,237,0.25),transparent_30%),radial-gradient(circle_at_65%_90%,rgba(6,182,212,0.18),transparent_30%)]" />

      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] items-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="hidden lg:block">
            <BrandLogo />

            <div className="mt-24 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Start your smarter workspace
              </div>

              <h1 className="mt-6 text-6xl font-black leading-[1.05] tracking-tight">
                Build a better business with{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  one intelligent workspace.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
                Bring sales, customers, tasks, invoices, team
                operations, and reports together in BusinessPilot AI.
              </p>

              <div className="mt-12 grid max-w-xl grid-cols-2 gap-4">
                <FeatureCard
                  title="Smart CRM"
                  text="Never miss an opportunity"
                />

                <FeatureCard
                  title="Secure Data"
                  text="Private workspace isolation"
                />

                <FeatureCard
                  title="AI Reports"
                  text="Know what needs attention"
                />

                <FeatureCard
                  title="Team Tools"
                  text="Run daily operations better"
                />
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
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 text-xl font-black text-slate-950">
                    +
                  </div>

                  <p className="text-sm font-semibold text-cyan-300">
                    Create your workspace
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    Start building smarter
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Create your secure BusinessPilot account in less
                    than a minute.
                  </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Your name
                    </label>

                    <input
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ali Khan"
                      autoComplete="name"
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Work email
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        required
                        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3.5 pr-20 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-cyan-300"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Confirm password
                    </label>

                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                    />
                  </div>

                  {message && (
                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-cyan-200">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-4 font-bold text-slate-950 shadow-xl shadow-blue-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Creating workspace..." : "Create free workspace"}
                  </button>
                </form>

                <div className="my-7 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-semibold tracking-[0.25em] text-slate-600">
                    ALREADY A MEMBER?
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <a
                  href="/login"
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200"
                >
                  Sign in to existing account
                </a>
              </div>

              <p className="mt-6 text-center text-xs leading-5 text-slate-600">
                Your data is protected with Supabase authentication
                and workspace-level security.
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
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 text-xl font-black text-slate-950">
        B
      </div>

      <div>
        <p className="text-xl font-bold">BusinessPilot</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">
          AI workspace
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
    </div>
  );
}
