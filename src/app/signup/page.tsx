"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

const animeImage =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663909266789/hVBICizaEhuJSkUJ.png";

export default function SignupPage( ) {
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

    setMessage("Account created successfully. You can now log in.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT: signup form only */}
        <section className="relative flex min-h-screen items-center justify-center overflow-y-auto px-5 py-10 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.15),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(124,58,237,0.14),transparent_35%)]" />

          <div className="relative z-10 w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 text-2xl font-black text-slate-950 shadow-lg shadow-cyan-950/40">
                B
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                BusinessPilot <span className="text-cyan-300">AI</span>
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Create your intelligent business workspace
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-2xl shadow-black/60 sm:p-9">
              <div className="mb-7">
                <p className="text-sm font-semibold text-cyan-300">
                  Get started free
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Create your account
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Manage leads, customers, tasks, invoices and reports in one
                  secure workspace.
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
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
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
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
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
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 pr-20 text-sm outline-none placeholder:text-slate-600 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 transition hover:text-cyan-300"
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
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
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
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-4 font-bold text-slate-950 shadow-lg shadow-blue-950/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Creating account..."
                    : "Create free account"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />

                <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-600">
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

            <p className="mt-6 text-center text-xs text-slate-600">
              Your data is protected with Supabase authentication.
            </p>
          </div>
        </section>

        {/* RIGHT: anime image only */}
        <section className="relative hidden min-h-screen overflow-hidden bg-[#020617] lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${animeImage}")` }}
          />

          {/* Very light overlay only; anime remains visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/20 via-transparent to-transparent" />

          <div className="absolute bottom-8 left-8 rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4 backdrop-blur-md">
            <p className="text-sm font-semibold text-white">
              Your business. One intelligent workspace.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Leads, invoices, tasks and analytics in one place.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
