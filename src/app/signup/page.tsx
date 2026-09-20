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
    <main className="relative flex min-h-[100dvh] w-full items-center justify-center lg:justify-end px-4 py-10 sm:px-8 lg:px-24">
      
      {/* 1. FIXED FULL SCREEN BACKGROUND IMAGE */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://files.manuscdn.com/user_upload_by_module/session_file/310519663909266789/fijqqcKOBuSsLxti.png')",
        }}
      />

      {/* 2. OVERLAY (Mobile ke liye light kar diya hai bg-black/10 taake image clear dikhe) */}
      <div className="fixed inset-0 z-0 bg-black/10 lg:bg-gradient-to-l lg:from-[#050816]/90 lg:to-transparent" />

      {/* 3. FLOATING GLASSMORPHISM FORM */}
      {/* Yahan bg-black/20 aur backdrop-blur-md kiya hai taake mobile par peeche ki image saaf nazar aaye */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-black/20 lg:bg-[#050816]/50 p-6 shadow-2xl backdrop-blur-md sm:p-10 my-8">
        
        {/* Mobile View Logo */}
        <div className="mb-6 lg:hidden">
          <BrandLogo />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
            Create your workspace
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-200 drop-shadow-md">
            Create your secure BusinessPilot account in less than a minute.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-100 drop-shadow-md">
              Your name
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ali Khan"
              required
              className="w-full rounded-xl border border-white/30 bg-black/30 px-4 py-3 sm:py-3.5 text-sm text-white outline-none placeholder:text-slate-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-sm transition"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-100 drop-shadow-md">
              Work email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              className="w-full rounded-xl border border-white/30 bg-black/30 px-4 py-3 sm:py-3.5 text-sm text-white outline-none placeholder:text-slate-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-sm transition"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-100 drop-shadow-md">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full rounded-xl border border-white/30 bg-black/30 px-4 py-3 sm:py-3.5 pr-20 text-sm text-white outline-none placeholder:text-slate-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-sm transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-300 hover:text-cyan-100 drop-shadow-md"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-100 drop-shadow-md">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              required
              className="w-full rounded-xl border border-white/30 bg-black/30 px-4 py-3 sm:py-3.5 text-sm text-white outline-none placeholder:text-slate-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-sm transition"
            />
          </div>

          {message && (
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-4 py-3 text-sm leading-6 text-cyan-100 backdrop-blur-md">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-5 py-3.5 sm:py-4 font-bold text-white shadow-xl shadow-blue-500/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating workspace..." : "Create free workspace"}
          </button>
        </form>

        <div className="my-5 sm:my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-[10px] font-bold tracking-[0.25em] text-slate-200 drop-shadow-md">
            ALREADY A MEMBER?
          </span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <a
          href="/login"
          className="block w-full rounded-xl border border-white/30 bg-white/10 px-5 py-3.5 text-center text-sm font-semibold text-slate-100 backdrop-blur-sm transition hover:border-cyan-400/50 hover:bg-cyan-400/20 hover:text-white"
        >
          Sign in to existing account
        </a>
      </div>
      
      {/* Hidden Feature Cards */}
      <div className="hidden">
        <FeatureCard title="Smart CRM" text="Never miss an opportunity" />
        <FeatureCard title="Secure Data" text="Private workspace isolation" />
        <FeatureCard title="AI Reports" text="Know what needs attention" />
        <FeatureCard title="Team Tools" text="Run daily operations better" />
      </div>

    </main>
  );
}

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 text-lg sm:text-xl font-black text-slate-950">
        B
      </div>
      <div>
        <p className="text-lg sm:text-xl font-bold text-white drop-shadow-md">BusinessPilot</p>
        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-cyan-300 drop-shadow-md">
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
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
    </div>
  );
}