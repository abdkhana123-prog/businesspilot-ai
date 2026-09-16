"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";

type Lead = {
  id: string;
  name: string;
  email?: string | null;
  stage?: string | null;
  status?: string | null;
  deal_value?: number | null;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  interest?: string | null;
};

type Invoice = {
  id: string;
  invoice_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  quantity?: number | null;
  price?: number | null;
  tax?: number | null;
  discount?: number | null;
  payment_status?: string | null;
  created_at?: string | null;
};

type Task = {
  id: string;
  title?: string | null;
  completed?: boolean | null;
  priority?: string | null;
  due_date?: string | null;
};

type Appointment = {
  id: string;
  title?: string | null;
  status?: string | null;
  scheduled_at?: string | null;
  client_name?: string | null;
};

export default function AIManagerPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState("");
  const [copied, setCopied] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadBusinessData();
  }, []);

  function getInvoiceTotal(invoice: Invoice) {
    const subtotal =
      Number(invoice.quantity || 1) * Number(invoice.price || 0);
    const tax = (subtotal * Number(invoice.tax || 0)) / 100;
    const discount = (subtotal * Number(invoice.discount || 0)) / 100;
    return subtotal + tax - discount;
  }

  async function loadBusinessData() {
    setLoading(true);
    setError("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const [leadsRes, invoicesRes, tasksRes, appointmentsRes] =
        await Promise.all([
          supabase
            .from("leads")
            .select(
              "id, name, email, stage, status, deal_value, follow_up_date, follow_up_notes, interest",
            )
            .eq("workspace_id", workspaceId)
            .order("created_at", { ascending: false })
            .limit(30),

          supabase
            .from("invoices")
            .select(
              "id, invoice_number, customer_name, customer_email, quantity, price, tax, discount, payment_status, created_at",
            )
            .eq("workspace_id", workspaceId)
            .order("created_at", { ascending: false })
            .limit(30),

          supabase
            .from("tasks")
            .select("id, title, completed, priority, due_date")
            .eq("workspace_id", workspaceId)
            .order("created_at", { ascending: false })
            .limit(30),

          supabase
            .from("appointments")
            .select("id, title, status, scheduled_at, client_name")
            .eq("workspace_id", workspaceId)
            .order("scheduled_at", { ascending: true })
            .limit(20),
        ]);

      if (leadsRes.error) throw new Error(leadsRes.error.message);
      if (invoicesRes.error) throw new Error(invoicesRes.error.message);
      // tasks/appointments optional — table missing ho to crash na ho
      setLeads((leadsRes.data || []) as Lead[]);
      setInvoices((invoicesRes.data || []) as Invoice[]);
      setTasks(((tasksRes.data || []) as Task[]) || []);
      setAppointments(((appointmentsRes.data || []) as Appointment[]) || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Business data could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const unpaidInvoices = invoices.filter(
      (inv) => String(inv.payment_status || "").toLowerCase() !== "paid",
    );

    const paidInvoices = invoices.filter(
      (inv) => String(inv.payment_status || "").toLowerCase() === "paid",
    );

    const overdueLeads = leads.filter((lead) => {
      const stage = String(lead.stage || "").toLowerCase();
      if (stage === "won" || stage === "lost") return false;
      return Boolean(lead.follow_up_date) && lead.follow_up_date! < today;
    });

    const openTasks = tasks.filter((task) => !task.completed);

    const upcomingAppointments = appointments.filter((a) => {
      const status = String(a.status || "").toLowerCase();
      return status === "scheduled" || status === "confirmed" || !a.status;
    });

    const unpaidTotal = unpaidInvoices.reduce(
      (sum, inv) => sum + getInvoiceTotal(inv),
      0,
    );

    const paidTotal = paidInvoices.reduce(
      (sum, inv) => sum + getInvoiceTotal(inv),
      0,
    );

    const pipelineValue = leads
      .filter((l) => String(l.stage || "").toLowerCase() !== "lost")
      .reduce((sum, l) => sum + Number(l.deal_value || 0), 0);

    return {
      unpaidInvoices,
      paidInvoices,
      overdueLeads,
      openTasks,
      upcomingAppointments,
      unpaidTotal,
      paidTotal,
      pipelineValue,
      totalLeads: leads.length,
    };
  }, [invoices, leads, tasks, appointments, today]);

  function buildFallbackBrief() {
    const topOverdue = stats.overdueLeads
      .slice(0, 3)
      .map((l) => `- ${l.name} (${l.stage || "Lead"}) — follow-up overdue`)
      .join("\n");

    const topUnpaid = stats.unpaidInvoices
      .slice(0, 3)
      .map(
        (inv) =>
          `- ${inv.invoice_number || "Invoice"} | ${inv.customer_name || "Client"} | $${getInvoiceTotal(inv).toFixed(2)}`,
      )
      .join("\n");

    const topTasks = stats.openTasks
      .slice(0, 3)
      .map((t) => `- ${t.title || "Task"}`)
      .join("\n");

    return `BUSINESSPILOT AI — DAILY EXECUTIVE BRIEF
Date: ${new Date().toLocaleDateString()}

1) TODAY'S SNAPSHOT
- Total Leads: ${stats.totalLeads}
- Pipeline Value: $${stats.pipelineValue.toLocaleString()}
- Paid Revenue (recent): $${stats.paidTotal.toLocaleString()}
- Unpaid Invoices: ${stats.unpaidInvoices.length} ($${stats.unpaidTotal.toLocaleString()})
- Overdue Follow-ups: ${stats.overdueLeads.length}
- Open Tasks: ${stats.openTasks.length}
- Upcoming Appointments: ${stats.upcomingAppointments.length}

2) URGENT PRIORITIES
A. Money at Risk (Unpaid Invoices)
${topUnpaid || "- No unpaid invoices right now."}

B. Sales Follow-ups Overdue
${topOverdue || "- No overdue leads right now."}

C. Operations / Tasks
${topTasks || "- No open tasks right now."}

3) RECOMMENDED ACTIONS (NEXT 60 MINUTES)
1. Send payment reminders for the top unpaid invoices.
2. Call/message the overdue leads and update their stage.
3. Clear the highest-priority open tasks.
4. Confirm today's appointments and prepare talking points.
5. Review pipeline value and push qualified deals forward.

4) READY-TO-SEND PAYMENT REMINDER
Hi [Client Name],
Just a quick reminder that invoice [Invoice Number] of $[Amount] is still pending.
Please let us know if you've already processed the payment or if you need the invoice resent.
Thank you,
BusinessPilot Team

5) READY-TO-SEND LEAD FOLLOW-UP
Hi [Lead Name],
I wanted to quickly follow up on our conversation about [Interest/Service].
Would you be open to a short call this week to finalize next steps?
Best regards,
BusinessPilot Sales Team

— Generated by BusinessPilot AI Copilot`;
  }

  async function generateBrief() {
    setGenerating(true);
    setError("");
    setBrief("");

    const compactData = {
      date: today,
      totals: {
        leads: stats.totalLeads,
        pipelineValue: stats.pipelineValue,
        unpaidCount: stats.unpaidInvoices.length,
        unpaidAmount: stats.unpaidTotal,
        paidAmount: stats.paidTotal,
        overdueLeads: stats.overdueLeads.length,
        openTasks: stats.openTasks.length,
        appointments: stats.upcomingAppointments.length,
      },
      overdueLeads: stats.overdueLeads.slice(0, 8).map((l) => ({
        name: l.name,
        email: l.email,
        stage: l.stage,
        deal_value: l.deal_value,
        follow_up_date: l.follow_up_date,
        interest: l.interest,
      })),
      unpaidInvoices: stats.unpaidInvoices.slice(0, 8).map((inv) => ({
        number: inv.invoice_number,
        customer: inv.customer_name,
        email: inv.customer_email,
        amount: getInvoiceTotal(inv),
        status: inv.payment_status,
      })),
      openTasks: stats.openTasks.slice(0, 8).map((t) => ({
        title: t.title,
        priority: t.priority,
        due_date: t.due_date,
      })),
      appointments: stats.upcomingAppointments.slice(0, 5).map((a) => ({
        title: a.title,
        client: a.client_name,
        status: a.status,
        when: a.scheduled_at,
      })),
    };

    const prompt = `You are an elite AI Operations Manager / Executive Assistant for a business using BusinessPilot AI.

Using this real workspace data, write a sharp daily business brief a CEO can act on immediately.

DATA:
${JSON.stringify(compactData, null, 2)}

Write in plain text (no markdown hashes). Use this structure:

1) EXECUTIVE SNAPSHOT
2) MONEY AT RISK
3) SALES PIPELINE RISKS
4) OPERATIONS / TASKS
5) TOP 5 ACTIONS FOR TODAY (prioritized)
6) 2 READY-TO-SEND MESSAGES
   - Payment reminder
   - Lead follow-up
7) ONE-LINE CEO SUMMARY

Rules:
- Be specific and practical
- Use actual names/numbers from data when available
- Keep it concise but high-value
- Sound like a $10,000/month operations manager
- If some lists are empty, say so and suggest proactive growth actions`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "AI brief failed");
      }

      setBrief((data.text || "").trim() || buildFallbackBrief());
    } catch {
      // Fail-safe: still give professional output
      setBrief(buildFallbackBrief());
    } finally {
      setGenerating(false);
    }
  }

  async function copyBrief() {
    if (!brief) return;
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadBrief() {
    if (!brief) return;
    const blob = new Blob([brief], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BusinessPilot_AI_Brief_${today}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              BusinessPilot AI Copilot
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              AI Operations Manager
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Your $10k/month executive assistant — daily brief, unpaid money
              alerts, overdue follow-ups, and ready-to-send actions in one click.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:border-cyan-400/40"
            >
              Dashboard
            </a>
            <a
              href="/leads"
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:border-cyan-400/40"
            >
              Leads
            </a>
            <a
              href="/invoices"
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:border-cyan-400/40"
            >
              Invoices
            </a>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Money at risk"
            value={`$${stats.unpaidTotal.toLocaleString()}`}
            detail={`${stats.unpaidInvoices.length} unpaid invoices`}
            tone="rose"
            loading={loading}
          />
          <Kpi
            label="Overdue follow-ups"
            value={`${stats.overdueLeads.length}`}
            detail="Leads needing action"
            tone="amber"
            loading={loading}
          />
          <Kpi
            label="Pipeline value"
            value={`$${stats.pipelineValue.toLocaleString()}`}
            detail={`${stats.totalLeads} active leads`}
            tone="cyan"
            loading={loading}
          />
          <Kpi
            label="Open tasks"
            value={`${stats.openTasks.length}`}
            detail={`${stats.upcomingAppointments.length} appointments`}
            tone="violet"
            loading={loading}
          />
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
          {/* Left: Control Panel */}
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
              Command center
            </p>
            <h2 className="mt-2 text-2xl font-black">Generate Daily Brief</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              AI will scan leads, invoices, tasks and appointments — then write
              a CEO-ready action plan.
            </p>

            <button
              type="button"
              onClick={generateBrief}
              disabled={loading || generating}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-200 hover:to-blue-400 disabled:opacity-50"
            >
              {generating
                ? "✨ AI Manager is thinking..."
                : loading
                  ? "Loading business data..."
                  : "✨ Generate AI Business Brief"}
            </button>

            <button
              type="button"
              onClick={loadBusinessData}
              disabled={loading || generating}
              className="mt-3 w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 hover:border-cyan-400/30 disabled:opacity-50"
            >
              🔄 Refresh Live Data
            </button>

            <div className="mt-8 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                What AI will check
              </p>
              <CheckRow text="Unpaid invoices & cash at risk" />
              <CheckRow text="Overdue lead follow-ups" />
              <CheckRow text="Open tasks & priorities" />
              <CheckRow text="Upcoming appointments" />
              <CheckRow text="Ready-to-send client messages" />
              <CheckRow text="Top 5 actions for today" />
            </div>

            <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.07] p-4">
              <p className="text-xs font-bold text-cyan-300">Why this sells</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                This replaces a junior operations / sales coordinator. One click
                gives the owner clarity, urgency, and messages ready to send.
              </p>
            </div>
          </section>

          {/* Right: Brief Output */}
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Executive output
                </p>
                <h2 className="mt-2 text-2xl font-black">AI Daily Brief</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyBrief}
                  disabled={!brief}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-40"
                >
                  {copied ? "✓ Copied" : "📋 Copy"}
                </button>
                <button
                  type="button"
                  onClick={downloadBrief}
                  disabled={!brief}
                  className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 disabled:opacity-40"
                >
                  📥 Download
                </button>
              </div>
            </div>

            <div className="min-h-[560px] whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm leading-7 text-slate-300">
              {generating ? (
                <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center">
                  <div className="mb-3 text-3xl">🧠</div>
                  <p className="font-bold text-slate-200">AI Manager working...</p>
                  <p className="mt-2 max-w-sm text-xs text-slate-500">
                    Reading invoices, leads, tasks and building your action plan.
                  </p>
                </div>
              ) : brief ? (
                brief
              ) : (
                <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center text-slate-600">
                  <div className="mb-3 text-4xl">✦</div>
                  <p className="font-semibold text-slate-400">
                    No brief generated yet
                  </p>
                  <p className="mt-2 max-w-md text-xs leading-6">
                    Click <span className="text-cyan-300">Generate AI Business Brief</span>{" "}
                    to get a CEO-style daily plan with unpaid invoice alerts,
                    overdue follow-ups, and ready messages.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Quick Attention Lists */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <MiniList
            title="Unpaid invoices"
            empty="No unpaid invoices 🎉"
            items={stats.unpaidInvoices.slice(0, 5).map((inv) => ({
              id: inv.id,
              title: inv.customer_name || "Client",
              subtitle: inv.invoice_number || "Invoice",
              right: `$${getInvoiceTotal(inv).toFixed(0)}`,
            }))}
          />
          <MiniList
            title="Overdue leads"
            empty="No overdue follow-ups"
            items={stats.overdueLeads.slice(0, 5).map((lead) => ({
              id: lead.id,
              title: lead.name,
              subtitle: lead.stage || "Lead",
              right: lead.follow_up_date || "",
            }))}
          />
          <MiniList
            title="Open tasks"
            empty="No open tasks"
            items={stats.openTasks.slice(0, 5).map((task) => ({
              id: task.id,
              title: task.title || "Task",
              subtitle: task.priority || "Normal",
              right: task.due_date || "",
            }))}
          />
        </section>

        <footer className="py-8 text-center text-xs text-slate-600">
          BusinessPilot AI · Operations Copilot · Built to replace busywork
        </footer>
      </div>
    </main>
  );
}

function Kpi({
  label,
  value,
  detail,
  tone,
  loading,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "rose" | "amber" | "cyan" | "violet";
  loading: boolean;
}) {
  const tones = {
    rose: "border-rose-400/20 from-rose-400/10 text-rose-300",
    amber: "border-amber-400/20 from-amber-400/10 text-amber-300",
    cyan: "border-cyan-400/20 from-cyan-400/10 text-cyan-300",
    violet: "border-violet-400/20 from-violet-400/10 text-violet-300",
  };

  return (
    <div
      className={`rounded-3xl border bg-gradient-to-br to-white/[0.03] p-5 ${tones[tone].split(" ").slice(0, 2).join(" ")}`}
    >
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-black ${tones[tone].split(" ").pop()}`}>
        {loading ? "—" : value}
      </p>
      <p className="mt-2 text-xs text-slate-600">{detail}</p>
    </div>
  );
}

function CheckRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-300">
      <span className="text-cyan-300">✓</span>
      {text}
    </div>
  );
}

function MiniList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { id: string; title: string; subtitle: string; right: string }[];
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-sm font-bold text-slate-200">{title}</h3>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-slate-600">{empty}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/40 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-200">
                  {item.title}
                </p>
                <p className="truncate text-xs text-slate-600">{item.subtitle}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-cyan-300">
                {item.right}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}