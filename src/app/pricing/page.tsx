"use client";

import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";

import { useState } from "react";

type BillingMode = "monthly" | "yearly";

type Plan = {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlighted?: boolean;
  badge?: string;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Starter",
    description: "For freelancers and very small teams getting organized.",
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: [
      "1 workspace",
      "2 team members",
      "Leads and customers",
      "Tasks and appointments",
      "Basic AI assistant",
      "Basic dashboard",
    ],
  },
  {
    name: "Growth",
    description: "For growing service businesses that need one operating system.",
    monthlyPrice: 59,
    yearlyPrice: 47,
    highlighted: true,
    badge: "Most popular",
    features: [
      "1 workspace",
      "10 team members",
      "Full CRM pipeline",
      "Invoices and expenses",
      "Reports and follow-ups",
      "AI business assistant",
      "Team roles and permissions",
      "Priority support",
    ],
  },
  {
    name: "Scale",
    description: "For established teams that need stronger controls and automation.",
    monthlyPrice: 149,
    yearlyPrice: 119,
    features: [
      "Multiple workspaces",
      "Unlimited team members",
      "Advanced reports",
      "Salary and attendance",
      "Document AI tools",
      "Custom workflows",
      "Audit activity logs",
      "Dedicated onboarding",
    ],
  },
];

export default function PricingPage() {
  const [billingMode, setBillingMode] =
    useState<BillingMode>("monthly");

  async function startPlan(planName: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const workspaceId = await getMyWorkspaceId();

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: planName,
        workspaceId,
        email: user.email,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.url) {
      throw new Error(
        result.error || "Could not open Stripe Checkout.",
      );
    }

    window.location.href = result.url;
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Could not start checkout.",
    );
  }
}

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(6,182,212,0.16),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.14),transparent_32%)]" />

      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 text-xl font-black text-white shadow-lg shadow-cyan-500/20">
              ✦
            </div>

            <div>
              <p className="text-lg font-black tracking-tight">
                BusinessPilot
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-300">
                Intelligent workspace
              </p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200 sm:block"
            >
              Sign in
            </a>

            <a
              href="/signup"
              className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Start free
            </a>
          </div>
        </header>

        <section className="mx-auto max-w-3xl py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Simple plans for growing businesses
          </div>

          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl">
            One workspace for your{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              entire business.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
            Start with the tools you need today and upgrade when your
            team and operations grow.
          </p>

          <div className="mt-8 inline-flex rounded-2xl border border-white/10 bg-white/[0.05] p-1">
            <button
              type="button"
              onClick={() => setBillingMode("monthly")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                billingMode === "monthly"
                  ? "bg-white text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setBillingMode("yearly")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                billingMode === "yearly"
                  ? "bg-white text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-emerald-400">
                Save 20%
              </span>
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const price =
              billingMode === "monthly"
                ? plan.monthlyPrice
                : plan.yearlyPrice;

            return (
              <article
                key={plan.name}
                className={`relative rounded-3xl border p-6 shadow-2xl backdrop-blur-xl ${
                  plan.highlighted
                    ? "border-cyan-300/50 bg-gradient-to-b from-cyan-400/[0.14] to-white/[0.05] shadow-cyan-950/30"
                    : "border-white/10 bg-white/[0.05] shadow-black/20"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6 rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950">
                    {plan.badge}
                  </div>
                )}

                <h2 className="text-2xl font-bold">{plan.name}</h2>

                <p className="mt-3 min-h-14 text-sm leading-6 text-slate-400">
                  {plan.description}
                </p>

                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-black">
                    ${price}
                  </span>

                  <span className="pb-2 text-sm text-slate-500">
                    /month
                  </span>
                </div>

                {billingMode === "yearly" && (
                  <p className="mt-2 text-xs text-emerald-300">
                    Billed annually
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => startPlan(plan.name)}
                  className={`mt-8 w-full rounded-xl px-5 py-3.5 text-sm font-bold transition ${
                    plan.highlighted
                      ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                      : "border border-white/10 bg-white/[0.06] text-slate-200 hover:border-cyan-400/40 hover:bg-cyan-400/10"
                  }`}
                >
                  Choose {plan.name}
                </button>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Includes
                  </p>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-3 text-sm text-slate-300"
                      >
                        <span className="text-emerald-300">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mx-auto mt-20 max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-sm font-semibold text-cyan-300">
            Need a custom setup?
          </p>

          <h2 className="mt-3 text-3xl font-black">
            We can configure BusinessPilot around your workflow.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            For agencies, real-estate teams, software houses, and
            service businesses with special requirements, start with a
            conversation about your process.
          </p>

          <a
            href="mailto:hello@businesspilot.ai?subject=BusinessPilot%20Custom%20Setup"
            className="mt-6 inline-block rounded-xl border border-cyan-300/40 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/10"
          >
            Talk about custom setup
          </a>
        </section>

        <p className="mt-10 text-center text-xs leading-6 text-slate-600">
          Pricing shown here is a product-plan preview. Connect a
          payment provider before accepting real subscriptions.
        </p>
      </div>
    </main>
  );
}
