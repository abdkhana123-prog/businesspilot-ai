"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";

type TestStatus = {
  db: { status: "pending" | "pass" | "fail"; msg: string };
  ai: { status: "pending" | "pass" | "fail"; msg: string; timeMs?: number };
  workspace: { status: "pending" | "pass" | "fail"; msg: string };
};

export default function SystemTestPage() {
  const [testing, setTesting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  const [testResults, setTestStatus] = useState<TestStatus>({
    db: { status: "pending", msg: "Not tested yet" },
    ai: { status: "pending", msg: "Not tested yet" },
    workspace: { status: "pending", msg: "Not tested yet" },
  });

  // 1-CLICK SYSTEM AUDIT
  async function runSystemAudit() {
    setTesting(true);
    setTestStatus({
      db: { status: "pending", msg: "Testing Database Connection..." },
      ai: { status: "pending", msg: "Testing AI Engine..." },
      workspace: { status: "pending", msg: "Checking Workspace Context..." },
    });

    let wsId = "";

    // Test 1: Workspace Check
    try {
      wsId = await getMyWorkspaceId();
      setTestStatus((prev) => ({
        ...prev,
        workspace: { status: "pass", msg: `Active Workspace ID: ${wsId.slice(0, 8)}...` },
      }));
    } catch (e: any) {
      setTestStatus((prev) => ({
        ...prev,
        workspace: { status: "fail", msg: e.message || "Failed to load workspace" },
      }));
    }

    // Test 2: Database Check
    try {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      if (error) throw error;

      setTestStatus((prev) => ({
        ...prev,
        db: { status: "pass", msg: `Connected successfully! Found ${count || 0} leads in DB.` },
      }));
    } catch (e: any) {
      setTestStatus((prev) => ({
        ...prev,
        db: { status: "fail", msg: e.message || "Database connection error" },
      }));
    }

    // Test 3: AI Engine Check
    try {
      const startTime = Date.now();
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Say 'AI Engine Online' in 3 words." }),
      });

      const data = await response.json();
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok || data.error) throw new Error(data.error || "AI Endpoint error");

      setTestStatus((prev) => ({
        ...prev,
        ai: { status: "pass", msg: `AI Online! Response: "${data.text.slice(0, 30)}..."`, timeMs: duration },
      }));
    } catch (e: any) {
      setTestStatus((prev) => ({
        ...prev,
        ai: { status: "fail", msg: e.message || "AI API test failed" },
      }));
    } finally {
      setTesting(false);
    }
  }

  // 1-CLICK DEMO DATA SEEDER (Populates realistic data)
  async function seedDemoData() {
    setSeeding(true);
    setSeedMsg("");

    try {
      const workspaceId = await getMyWorkspaceId();

      // Sample Leads
      const sampleLeads = [
        { workspace_id: workspaceId, name: "Ali Khan (TechCorp)", email: "ali@techcorp.com", phone: "923001234567", interest: "AI Automation Suite", deal_value: 2500, stage: "Qualified", status: "New" },
        { workspace_id: workspaceId, name: "Sara Ahmed (DesignStudio)", email: "sara@designstudio.io", phone: "971501234567", interest: "Custom Web Redesign", deal_value: 1200, stage: "Proposal Sent", status: "New" },
        { workspace_id: workspaceId, name: "Global Logistics Ltd", email: "contact@globallogistics.com", phone: "14155552671", interest: "ERP Integration", deal_value: 5000, stage: "Won", status: "Closed" },
      ];

      // Sample Invoices
      const now = Date.now();
      const sampleInvoices = [
        { workspace_id: workspaceId, invoice_number: `INV-${now.toString().slice(-6)}1`, customer_name: "Ali Khan (TechCorp)", customer_email: "ali@techcorp.com", description: "AI Suite Phase 1 Setup", quantity: 1, price: 1500, tax: 0, discount: 0, payment_status: "Paid", paid_amount: 1500 },
        { workspace_id: workspaceId, invoice_number: `INV-${now.toString().slice(-6)}2`, customer_name: "Sara Ahmed", customer_email: "sara@designstudio.io", description: "UI/UX Consultation & Wireframes", quantity: 1, price: 800, tax: 0, discount: 0, payment_status: "Unpaid", paid_amount: 0 },
        { workspace_id: workspaceId, invoice_number: `INV-${now.toString().slice(-6)}3`, customer_name: "Global Logistics Ltd", customer_email: "contact@globallogistics.com", description: "Enterprise License Annual", quantity: 1, price: 3500, tax: 0, discount: 0, payment_status: "Paid", paid_amount: 3500 },
      ];

      // Sample Expenses
      const sampleExpenses = [
        { workspace_id: workspaceId, title: "Cloud Server Hosting (Vercel & Supabase)", category: "Software", amount: 120, expense_date: new Date().toISOString().slice(0, 10), notes: "Monthly server bill" },
        { workspace_id: workspaceId, title: "Google Ads Lead Generation", category: "Marketing", amount: 450, expense_date: new Date().toISOString().slice(0, 10), notes: "PPC campaign" },
      ];

      // Insert all in parallel
      await Promise.all([
        supabase.from("leads").insert(sampleLeads),
        supabase.from("invoices").insert(sampleInvoices),
        supabase.from("expenses").insert(sampleExpenses),
      ]);

      setSeedMsg("🎉 SUCCESS! Sample Leads, Invoices & Expenses added to database. Open Dashboard to view live charts!");
    } catch (e: any) {
      setSeedMsg(`⚠️ Seeding Error: ${e.message || "Failed to insert sample data."}`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 sm:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">Automated QA Suite</span>
            <h1 className="text-3xl font-black mt-1">1-Click System Audit & Demo Seeder</h1>
            <p className="text-xs text-slate-400 mt-1">Verify all APIs, DB connections, and generate test data in 1 click.</p>
          </div>
          <a href="/dashboard" className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/5">
            Dashboard →
          </a>
        </div>

        {/* Action Controls */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Audit Card */}
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧪</span>
              <div>
                <h2 className="font-bold text-lg text-cyan-200">1-Click System Audit</h2>
                <p className="text-xs text-slate-400">Tests DB, AI API speed, and Workspace Context</p>
              </div>
            </div>

            <button
              onClick={runSystemAudit}
              disabled={testing}
              className="w-full rounded-2xl bg-cyan-300 py-3.5 text-xs font-black text-slate-950 hover:bg-cyan-200 disabled:opacity-50 transition shadow-lg shadow-cyan-500/10"
            >
              {testing ? "⚡ Auditing System..." : "🚀 Run Full System Audit"}
            </button>
          </div>

          {/* Seeder Card */}
          <div className="rounded-3xl border border-violet-400/20 bg-violet-400/5 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              <div>
                <h2 className="font-bold text-lg text-violet-200">1-Click Demo Data Injector</h2>
                <p className="text-xs text-slate-400">Populates Database with fake Leads, Invoices & Expenses</p>
              </div>
            </div>

            <button
              onClick={seedDemoData}
              disabled={seeding}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-400 to-blue-500 py-3.5 text-xs font-black text-white hover:from-violet-300 hover:to-blue-400 disabled:opacity-50 transition shadow-lg shadow-violet-500/10"
            >
              {seeding ? "⏳ Injecting Sample Data..." : "🌱 Inject Sample Data for Demo"}
            </button>
          </div>
        </div>

        {/* Seeder Message Output */}
        {seedMsg && (
          <div className="p-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 text-xs font-bold text-center">
            {seedMsg}
          </div>
        )}

        {/* Audit Results Table */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Audit Results</h3>

          <div className="space-y-3">
            <ResultRow label="Database Connection (Supabase)" result={testResults.db} />
            <ResultRow label="AI Engine API (/api/ai - Groq)" result={testResults.ai} />
            <ResultRow label="Workspace Multi-Tenancy Engine" result={testResults.workspace} />
          </div>
        </div>

        {/* Route Quick Switcher */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-4">Module Navigation Checklist</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
            <ModuleLink name="AI Chat OS" href="/" icon="💬" />
            <ModuleLink name="Dashboard & Charts" href="/dashboard" icon="📊" />
            <ModuleLink name="AI Manager" href="/ai-manager" icon="🧠" />
            <ModuleLink name="Leads & WhatsApp" href="/leads" icon="📲" />
            <ModuleLink name="Invoices & PDF" href="/invoices" icon="🧾" />
            <ModuleLink name="AI Proposals" href="/proposals" icon="📄" />
            <ModuleLink name="Analytics & CFO" href="/analytics" icon="📈" />
            <ModuleLink name="White-Label Settings" href="/settings" icon="⚙️" />
            <ModuleLink name="Public Payment Link" href="/pay/INV-1001" icon="💳" />
            <ModuleLink name="SaaS Landing Page" href="/landing" icon="🌐" />
          </div>
        </div>

      </div>
    </main>
  );
}

function ResultRow({ label, result }: { label: string; result: { status: string; msg: string; timeMs?: number } }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/60 text-xs">
      <div>
        <p className="font-bold text-slate-200">{label}</p>
        <p className="text-slate-400 mt-1 font-mono text-[11px]">{result.msg}</p>
      </div>

      <div className="flex items-center gap-3">
        {result.timeMs && (
          <span className="text-[10px] text-cyan-300 font-mono font-bold bg-cyan-400/10 px-2 py-1 rounded-md">
            {result.timeMs}ms
          </span>
        )}
        <span
          className={`px-3 py-1 font-black rounded-full uppercase text-[10px] ${
            result.status === "pass"
              ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
              : result.status === "fail"
              ? "bg-rose-400/20 text-rose-300 border border-rose-400/30"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {result.status}
        </span>
      </div>
    </div>
  );
}

function ModuleLink({ name, href, icon }: { name: string; href: string; icon: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="p-3 rounded-xl border border-white/5 bg-slate-950/40 hover:bg-white/5 hover:border-cyan-400/30 transition flex items-center gap-2 text-slate-300 hover:text-cyan-300"
    >
      <span>{icon}</span>
      <span className="truncate">{name}</span>
    </a>
  );
}