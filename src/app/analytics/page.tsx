"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Lead = {
  id: string;
  status: string | null;
  stage: string | null;
  created_at: string;
};

type Invoice = {
  id: string;
  quantity: number | null;
  price: number | null;
  payment_status: string | null;
  created_at: string;
};

type Expense = {
  id: string;
  amount: number | null;
  category: string | null;
  expense_date: string | null;
};

type AnalyticsData = {
  leads: Lead[];
  invoices: Invoice[];
  expenses: Expense[];
  customers: number;
  tasks: number;
  appointments: number;
};

const PIE_COLORS = ["#22d3ee", "#8b5cf6", "#fbbf24", "#10b981", "#f43f5e"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    leads: [],
    invoices: [],
    expenses: [],
    customers: 0,
    tasks: 0,
    appointments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Naye AI Features ki State
  const [aiInsight, setAiInsight] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const [
        leadsResult,
        invoicesResult,
        expensesResult,
        customersResult,
        tasksResult,
        appointmentsResult,
      ] = await Promise.all([
        supabase.from("leads").select("id, status, stage, created_at").eq("workspace_id", workspaceId),
        supabase.from("invoices").select("id, quantity, price, payment_status, created_at").eq("workspace_id", workspaceId),
        supabase.from("expenses").select("id, amount, category, expense_date").eq("workspace_id", workspaceId),
        supabase.from("customers").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("completed", false),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "Scheduled"),
      ]);

      const firstError =
        leadsResult.error || invoicesResult.error || expensesResult.error || customersResult.error || tasksResult.error || appointmentsResult.error;

      if (firstError) {
        throw new Error(firstError.message);
      }

      setData({
        leads: (leadsResult.data || []) as Lead[],
        invoices: (invoicesResult.data || []) as Invoice[],
        expenses: (expensesResult.data || []) as Expense[],
        customers: customersResult.count || 0,
        tasks: tasksResult.count || 0,
        appointments: appointmentsResult.count || 0,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Analytics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  const paidRevenue = data.invoices
    .filter((invoice) => invoice.payment_status?.toLowerCase() === "paid")
    .reduce((total, invoice) => total + Number(invoice.quantity || 1) * Number(invoice.price || 0), 0);

  const totalBilled = data.invoices.reduce(
    (total, invoice) => total + Number(invoice.quantity || 1) * Number(invoice.price || 0), 0
  );

  const totalExpenses = data.expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);

  const outstanding = totalBilled - paidRevenue;
  const netPosition = paidRevenue - totalExpenses;

  const leadStages = useMemo(() => {
    const stages = ["New", "Contacted", "Qualified", "Won"];
    return stages.map((stage) => ({
      stage,
      count: data.leads.filter((lead) => (lead.stage || lead.status || "New").toLowerCase() === stage.toLowerCase()).length,
    }));
  }, [data.leads]);

  const maxStageCount = Math.max(...leadStages.map((item) => item.count), 1);

  // Recharts ke liye formatted data
  const financialChartData = [
    { name: "Collected", value: paidRevenue, fill: "#22d3ee" },
    { name: "Expenses", value: totalExpenses, fill: "#f43f5e" },
    { name: "Outstanding", value: outstanding, fill: "#fbbf24" },
  ];

  // ==================== NEW FEATURE: AI CFO REPORT ====================
  async function generateAIInsights() {
    setIsGeneratingAI(true);
    setAiInsight("");

    const prompt = `You are an expert Chief Financial Officer (CFO). Analyze this business data and provide a concise, highly professional 3-paragraph executive summary:
    - Total Collected Revenue: $${paidRevenue}
    - Outstanding (Unpaid) Invoices: $${outstanding}
    - Total Operating Expenses: $${totalExpenses}
    - Net Profit Position: $${netPosition}
    - Active Leads: ${data.leads.length}
    - Total Customers: ${data.customers}
    - Pending Tasks: ${data.tasks}
    
    Structure your response as:
    1. Financial Health Overview
    2. Operational Efficiency (Leads & Tasks)
    3. Strategic Recommendations (What to do next to increase cash flow)`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI Error");

      setAiInsight(result.text);
    } catch (err) {
      setAiInsight("AI Engine is currently busy. Based on your numbers, your net position is $" + netPosition + ". Focus on collecting the outstanding $" + outstanding + " and clearing the " + data.tasks + " pending tasks to optimize cash flow.");
    } finally {
      setIsGeneratingAI(false);
    }
  }

  // PDF Export Print Function
  const exportPDF = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white sm:px-8 print:bg-white print:text-black">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end print:hidden">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 text-xl font-black shadow-lg shadow-cyan-500/20">
                ◌
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                  Business intelligence
                </p>
                <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                  Analytics & Reports
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Understand your revenue, pipeline, workload, and get AI-driven CFO insights.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportPDF}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 transition"
            >
              📥 Export PDF
            </button>
            <button
              type="button"
              onClick={loadAnalytics}
              disabled={loading}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-4 text-sm text-rose-200 print:hidden">
            {error}
          </div>
        )}

        {/* METRICS (ORIGINAL) */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AnalyticsCard label="Paid revenue" value={`$${paidRevenue.toLocaleString()}`} detail="Collected invoices" color="cyan" icon="↗" />
          <AnalyticsCard label="Net position" value={`$${netPosition.toLocaleString()}`} detail="Revenue minus expenses" color="violet" icon="◈" />
          <AnalyticsCard label="Outstanding" value={`$${outstanding.toLocaleString()}`} detail="Unpaid invoice value" color="amber" icon="!" />
          <AnalyticsCard label="Active workload" value={`${data.tasks + data.appointments}`} detail="Tasks and appointments" color="emerald" icon="✓" />
        </section>

        {/* NEW FEATURE: AI CFO REPORT SECTION */}
        <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-900/20 to-blue-900/10 p-6 shadow-2xl sm:p-8 print:hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-400/20 pb-4 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Enterprise AI Engine</p>
              <h2 className="text-xl font-black text-white">Chief Financial Officer (CFO) Insights</h2>
            </div>
            <button
              onClick={generateAIInsights}
              disabled={isGeneratingAI || loading}
              className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-50 shadow-lg shadow-cyan-500/20 transition"
            >
              {isGeneratingAI ? "🧠 Analyzing Business Data..." : "✨ Generate CFO Report"}
            </button>
          </div>
          
          <div className="text-sm leading-7 text-slate-300 whitespace-pre-wrap">
            {aiInsight ? (
              aiInsight
            ) : (
              <span className="text-slate-500 italic">Click the button above to generate a deep-dive financial analysis of your business metrics.</span>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* REVENUE HEALTH (ORIGINAL + RECHARTS) */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 sm:p-8 print:border-gray-300 print:text-black">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300 print:text-gray-600">
              Revenue health
            </p>
            <h2 className="mt-2 text-2xl font-black print:text-black">Financial snapshot</h2>

            {/* NEW: Interactive Bar Chart */}
            <div className="h-48 w-full mt-6 print:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                    {financialChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-6">
              <ProgressRow label="Collected revenue" value={paidRevenue} maximum={Math.max(totalBilled, 1)} color="bg-cyan-300" />
              <ProgressRow label="Outstanding invoices" value={outstanding} maximum={Math.max(totalBilled, 1)} color="bg-amber-300" />
              <ProgressRow label="Operating expenses" value={totalExpenses} maximum={Math.max(paidRevenue, 1)} color="bg-rose-300" />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <SmallMetric label="Invoices" value={data.invoices.length} />
              <SmallMetric label="Expenses" value={data.expenses.length} />
              <SmallMetric label="Customers" value={data.customers} />
            </div>
          </div>

          {/* SALES PIPELINE (ORIGINAL + RECHARTS) */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 sm:p-8 print:border-gray-300">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300 print:text-gray-600">
              Sales pipeline
            </p>
            <h2 className="mt-2 text-2xl font-black print:text-black">Lead progression</h2>

            {/* NEW: Interactive Pie Chart */}
            <div className="h-48 w-full mt-6 print:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadStages.filter(l => l.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="stage"
                  >
                    {leadStages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-5">
              {leadStages.map((item) => (
                <div key={item.stage}>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="font-semibold text-slate-400 print:text-gray-600">{item.stage}</span>
                    <span className="font-bold text-slate-200 print:text-black">{item.count}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-950 print:bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-blue-500 transition-all print:bg-gray-800"
                      style={{ width: `${Math.max(5, (item.count / maxStageCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <a href="/leads" className="mt-8 inline-block text-sm font-bold text-cyan-300 hover:text-cyan-200 print:hidden">
              Open sales pipeline →
            </a>
          </div>
        </section>

        {/* MINI LINKS (ORIGINAL) */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
          <MiniLink title="Leads" value={data.leads.length} href="/leads" icon="◎" />
          <MiniLink title="Customers" value={data.customers} href="/customers" icon="◉" />
          <MiniLink title="Pending tasks" value={data.tasks} href="/tasks" icon="✓" />
          <MiniLink title="Appointments" value={data.appointments} href="/appointments" icon="◷" />
        </section>
      </div>
    </main>
  );
}

// =================== ORIGINAL COMPONENTS (NO CHANGES) ===================

function AnalyticsCard({ label, value, detail, color, icon }: any) {
  const colors = {
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    violet: "border-violet-400/20 bg-violet-400/10 text-violet-300",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20 print:border-gray-300">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-lg ${colors[color as keyof typeof colors]} print:bg-gray-100 print:text-black`}>
        {icon}
      </div>
      <p className="mt-5 text-xs font-semibold text-slate-500 print:text-gray-600">{label}</p>
      <p className="mt-2 text-3xl font-black print:text-black">{value}</p>
      <p className="mt-2 text-xs text-slate-600 print:text-gray-500">{detail}</p>
    </div>
  );
}

function ProgressRow({ label, value, maximum, color }: any) {
  const percentage = Math.min(100, Math.max(5, (value / maximum) * 100));
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="text-slate-400 print:text-gray-600">{label}</span>
        <span className="font-bold text-slate-200 print:text-black">${value.toLocaleString()}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-950 print:bg-gray-200">
        <div className={`h-full rounded-full ${color} print:bg-gray-800`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function SmallMetric({ label, value }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 print:border-gray-300">
      <p className="text-xs text-slate-600 print:text-gray-600">{label}</p>
      <p className="mt-2 text-xl font-black print:text-black">{value}</p>
    </div>
  );
}

function MiniLink({ title, value, href, icon }: any) {
  return (
    <a href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-cyan-400/30">
      <span className="text-xl text-cyan-300">{icon}</span>
      <p className="mt-4 text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </a>
  );
}