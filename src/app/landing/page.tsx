"use client";

import { useState } from "react";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  return (
    <div className="min-h-screen bg-[#050816] text-white selection:bg-cyan-500 selection:text-black">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(6,182,212,0.15),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(124,58,237,0.15),transparent_35%)]" />

      {/* Navbar */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 text-lg font-black text-white shadow-lg shadow-cyan-500/20">
            ✦
          </div>
          <span className="text-xl font-black tracking-tight">
            BusinessPilot AI
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-semibold text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-cyan-300">
            Features
          </a>
          <a href="#pricing" className="transition hover:text-cyan-300">
            Pricing
          </a>
          <a href="/analytics" className="transition hover:text-cyan-300">
            Analytics
          </a>
          <a href="/" className="transition hover:text-cyan-300">
            AI Chat
          </a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
          >
            Dashboard
          </a>
          <a
            href="/ai-manager"
            className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-200 hover:to-blue-400"
          >
            Launch Copilot
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-20 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-bold text-cyan-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          The AI Business Operating System for Modern Teams
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[1.1] tracking-tight sm:text-7xl">
          Run Your Entire Business On{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            AI Auto-Pilot
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
          Automate invoices, follow up leads with 1-click WhatsApp, generate AI
          proposals, track cash flow, and get daily CEO briefings from your
          personal AI Operations Manager.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/ai-manager"
            className="rounded-2xl bg-cyan-300 px-8 py-4 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:bg-cyan-200"
          >
            ✨ Open AI Operations Manager
          </a>
          <a
            href="/leads"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-4 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08]"
          >
            📲 Explore WhatsApp Pipeline
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-4 lg:p-8">
          <Stat value="AI Chat" label="Natural language workspace" />
          <Stat value="1-Click" label="WhatsApp + PDF invoices" />
          <Stat value="CFO AI" label="Daily executive briefings" />
          <Stat value="Multi$" label="USD · AED · PKR · EUR · GBP" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="mb-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            Enterprise Modules
          </p>
          <h2 className="mt-2 text-3xl font-black sm:text-5xl">
            Everything You Need to Scale
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
            One platform for sales, finance, operations, proposals, analytics,
            and AI automation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="🧠"
            title="AI Operations Manager"
            desc="CEO daily briefings, unpaid invoice alerts, overdue follow-ups, and prioritized action plans."
            href="/ai-manager"
            badge="Copilot"
          />
          <FeatureCard
            icon="💬"
            title="AI Business Chat"
            desc="Create leads, tasks, invoices, customers, and appointments using natural language commands."
            href="/"
            badge="Chat OS"
          />
          <FeatureCard
            icon="📲"
            title="1-Click WhatsApp CRM"
            desc="Send AI follow-ups and payment reminders directly to WhatsApp without paid messaging APIs."
            href="/leads"
            badge="WhatsApp"
          />
          <FeatureCard
            icon="🧾"
            title="Smart Invoicing & PDFs"
            desc="Track billed vs collected revenue, export CSV, and generate corporate printable invoices."
            href="/invoices"
            badge="Finance"
          />
          <FeatureCard
            icon="📄"
            title="AI Proposal Engine"
            desc="Generate tailored proposals with deliverables, timelines, and commercial terms in seconds."
            href="/proposals"
            badge="Sales"
          />
          <FeatureCard
            icon="📊"
            title="BI Analytics + AI CFO"
            desc="Interactive charts, pipeline progression, and AI advice to improve monthly cash flow."
            href="/analytics"
            badge="Reports"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-black">From chaos to clarity in 3 steps</h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Step
              n="01"
              title="Connect your workspace"
              desc="Add leads, invoices, tasks, and customers in one secure multi-tenant workspace."
            />
            <Step
              n="02"
              title="Let AI handle busywork"
              desc="Generate follow-ups, proposals, CFO reports, and WhatsApp reminders instantly."
            />
            <Step
              n="03"
              title="Close more, collect faster"
              desc="Track pipeline, send payment reminders, export PDFs, and grow recurring revenue."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="relative z-10 mx-auto max-w-7xl border-t border-white/10 px-6 py-20"
      >
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">
            Monetization Ready
          </p>
          <h2 className="mt-2 text-3xl font-black sm:text-5xl">
            SaaS Pricing That Sells
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Perfect for agencies, freelancers, and multi-client businesses.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] p-1.5">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                billingCycle === "monthly"
                  ? "bg-cyan-300 text-slate-950"
                  : "text-slate-400"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                billingCycle === "annual"
                  ? "bg-cyan-300 text-slate-950"
                  : "text-slate-400"
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <PriceCard
            plan="Starter"
            price={billingCycle === "monthly" ? "$29" : "$23"}
            period={
              billingCycle === "monthly" ? "/month" : "/mo billed annually"
            }
            desc="Ideal for freelancers & solo founders."
            features={[
              "AI Business Chat",
              "Up to 50 Leads",
              "Invoice PDFs",
              "WhatsApp Quick Msg",
              "Email Support",
            ]}
            cta="Start Free Trial"
            href="/dashboard"
          />
          <PriceCard
            plan="Pro Business"
            price={billingCycle === "monthly" ? "$79" : "$63"}
            period={
              billingCycle === "monthly" ? "/month" : "/mo billed annually"
            }
            desc="For growing agencies & small teams."
            features={[
              "Unlimited Leads & Invoices",
              "AI Operations Manager",
              "AI Proposal Generator",
              "Full Analytics & CSV Export",
              "Priority Support",
            ]}
            popular
            cta="Launch Pro Workspace"
            href="/ai-manager"
          />
          <PriceCard
            plan="Enterprise"
            price={billingCycle === "monthly" ? "$199" : "$159"}
            period={
              billingCycle === "monthly" ? "/month" : "/mo billed annually"
            }
            desc="For larger organizations & multi-brand ops."
            features={[
              "Everything in Pro",
              "White-Label Branding",
              "Multi-Currency Engine",
              "AI CFO Reports",
              "Dedicated Onboarding",
            ]}
            cta="Contact Sales"
            href="/settings"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 via-blue-500/10 to-violet-500/10 p-10 text-center shadow-2xl">
          <h2 className="text-3xl font-black sm:text-4xl">
            Ready to Productize Your Operations?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            BusinessPilot AI is built as a turnkey SaaS — chat automation,
            finance, sales pipeline, analytics, and AI management in one dark
            modern workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/dashboard"
              className="inline-block rounded-2xl bg-cyan-300 px-8 py-4 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:bg-cyan-200"
            >
              Enter Workspace →
            </a>
            <a
              href="/"
              className="inline-block rounded-2xl border border-white/10 px-8 py-4 text-sm font-bold text-slate-200 transition hover:bg-white/5"
            >
              Try AI Chat
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-8 text-center text-xs text-slate-600">
        <p>BusinessPilot AI · Complete SaaS Business Operating System</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-slate-500">
          <a href="/" className="hover:text-cyan-300">
            AI Chat
          </a>
          <a href="/dashboard" className="hover:text-cyan-300">
            Dashboard
          </a>
          <a href="/invoices" className="hover:text-cyan-300">
            Invoices
          </a>
          <a href="/leads" className="hover:text-cyan-300">
            Leads
          </a>
          <a href="/ai-manager" className="hover:text-cyan-300">
            AI Manager
          </a>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black text-cyan-300 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  href,
  badge,
}: {
  icon: string;
  title: string;
  desc: string;
  href: string;
  badge: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-xl transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300">
          {badge}
        </span>
      </div>
      <h3 className="mt-6 text-xl font-bold text-slate-100 transition group-hover:text-cyan-300">
        {title}
      </h3>
      <p className="mt-2 text-xs leading-6 text-slate-400">{desc}</p>
    </a>
  );
}

function Step({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
      <p className="text-xs font-black text-cyan-300">{n}</p>
      <h3 className="mt-3 text-lg font-bold text-slate-100">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-slate-400">{desc}</p>
    </div>
  );
}

function PriceCard({
  plan,
  price,
  period,
  desc,
  features,
  popular = false,
  cta,
  href,
}: {
  plan: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  popular?: boolean;
  cta: string;
  href: string;
}) {
  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl border p-8 shadow-2xl ${
        popular
          ? "border-cyan-400 bg-cyan-400/[0.06]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div>
        {popular && (
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">
            Most Popular
          </span>
        )}
        <h3 className="text-lg font-bold text-slate-200">{plan}</h3>
        <p className="mt-2 text-xs text-slate-500">{desc}</p>
        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-4xl font-black text-white">{price}</span>
          <span className="text-xs text-slate-500">{period}</span>
        </div>

        <ul className="mt-8 space-y-3 text-xs text-slate-300">
          {features.map((feat) => (
            <li key={feat} className="flex items-center gap-2">
              <span className="text-cyan-300">✓</span> {feat}
            </li>
          ))}
        </ul>
      </div>

      <a
        href={href}
        className={`mt-8 w-full rounded-xl py-3 text-center text-xs font-black transition ${
          popular
            ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            : "border border-white/10 text-white hover:bg-white/10"
        }`}
      >
        {cta}
      </a>
    </div>
  );
}