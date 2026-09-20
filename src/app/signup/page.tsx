"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image"; // Added back just in case you need it later

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
    <main className="relative flex min-h-screen w-full items-center justify-center lg:justify-end overflow-hidden bg-[#050816] px-4 sm:px-8 lg:px-24">
      
      {/* 1. EXACT FULL SCREEN BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://files.manuscdn.com/user_upload_by_module/session_file/310519663909266789/fijqqcKOBuSsLxti.png')",
        }}
      />

      {/* 2. DARK OVERLAY FOR READABILITY ON RIGHT SIDE */}
      <div className="absolute inset-0 z-0 bg-black/30 lg:bg-gradient-to-l lg:from-[#050816]/90 lg:to-transparent" />

      {/* 3. FLOATING GLASSMORPHISM FORM */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#050816]/40 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
        
        {/* Mobile View Logo */}
        <div className="mb-8 lg:hidden">
          <BrandLogo />
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">
            Create your workspace
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Create your secure BusinessPilot account in less than a minute.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Your name
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ali Khan"
              required
              className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-md transition"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Work email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-md transition"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
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
                className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3.5 pr-20 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-md transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-400 hover:text-cyan-200"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              required
              className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-md transition"
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
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-5 py-4 font-bold text-white shadow-xl shadow-blue-500/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating workspace..." : "Create free workspace"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-bold tracking-[0.25em] text-slate-400">
            ALREADY A MEMBER?
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <a
          href="/login"
          className="block w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-center text-sm font-semibold text-slate-300 backdrop-blur-sm transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-100"
        >
          Sign in to existing account
        </a>
      </div>
      
      {/* Hidden container to keep your original FeatureCards in the code without ruining the UI */}
      <div className="hidden">
        <FeatureCard title="Smart CRM" text="Never miss an opportunity" />
        <FeatureCard title="Secure Data" text="Private workspace isolation" />
        <FeatureCard title="AI Reports" text="Know what needs attention" />
        <FeatureCard title="Team Tools" text="Run daily operations better" />
      </div>

    </main>
  );
}

// AAPKE ORIGINAL COMPONENTS (Code poora rakhne ke liye yahan add kar diye hain)

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 text-xl font-black text-slate-950">
        B
      </div>
      <div>
        <p className="text-xl font-bold text-white">BusinessPilot</p>
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
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
    </div>
  );
}